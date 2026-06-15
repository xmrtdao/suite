
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { corsHeaders } from "../_shared/cors.ts";
import { startUsageTracking } from "../_shared/functionUsageLogger.ts";

const FUNCTION_NAME = 'daily-news-finder';
const RSS_FEED_URL = 'http://feeds.bbci.co.uk/news/world/rss.xml';

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const usageTracker = startUsageTracking(FUNCTION_NAME, 'gemini', { method: req.method });

    // Track which providers we attempt and why each one failed, so the final
    // error tells the operator exactly what's missing instead of a generic 500.
    const providerResults: Record<string, string> = {};

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const ollamaApiKey = Deno.env.get('OLLAMA_API_KEY');
        const ollamaLocalHost = Deno.env.get('OLLAMA_HOST');   // e.g. http://localhost:11434
        const ollamaLocalModel = Deno.env.get('OLLAMA_MODEL');  // e.g. gemma3:1b
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const ollamaProModel = Deno.env.get('OLLAMA_PRO_MODEL') || 'deepseek-v4-flash:cloud';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing configuration (Supabase URL or Key).');
        }
        if (!ollamaApiKey && !ollamaLocalHost && !geminiApiKey && !deepseekApiKey) {
            const msg = 'No AI provider configured. Set OLLAMA_HOST (zero-key local) or one of: OLLAMA_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY. See local-supabase/.env.example.';
            throw new Error(msg);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log(`📰 Fetching RSS Feed from: ${RSS_FEED_URL}`);

        // 1. Fetch RSS Feed
        const rssResponse = await fetch(RSS_FEED_URL);
        if (!rssResponse.ok) {
            throw new Error(`Failed to fetch RSS feed: ${rssResponse.statusText}`);
        }
        const rssText = await rssResponse.text();

        // 2. Parse RSS (Simple Regex/String parsing for durability in Edge runtime without heavy xml libs)
        // Extract items
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        while ((match = itemRegex.exec(rssText)) !== null) {
            const itemContent = match[1];
            const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/.exec(itemContent);
            const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
            const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/.exec(itemContent);

            const title = titleMatch?.[1] || titleMatch?.[2] || 'No Title';
            const link = linkMatch?.[1] || '';
            const description = descMatch?.[1] || descMatch?.[2] || '';

            items.push({ title, link, description });
            if (items.length >= 10) break; // Limit to top 10 for analysis
        }

        if (items.length === 0) {
            throw new Error('No items found in RSS feed.');
        }

        console.log(`🔍 Analyzed ${items.length} news items. asking Gemini to pick the best one...`);

        // 3. AI Analysis & Content Generation
        // Read new brand variables from env so the prompt stays in sync
        // with whatever coin / publication Joe is currently running.
        const coinSymbol = Deno.env.get('PARAGRAPH_COIN_SYMBOL');           // e.g. "MONERO"
        const coinContract = Deno.env.get('PARAGRAPH_COIN_CONTRACT');       // e.g. 0xD505...
        const pubHandle = Deno.env.get('PARAGRAPH_PUBLICATION_HANDLE') || 'mobilemonero';

        const prompt = `
    You are the Chief Information Officer for XMRT DAO.

    Brand context:
    - Publication: @${pubHandle} on Paragraph.com
    - Featured coin: $${coinSymbol || 'MONERO'} (contract: ${coinContract || '0xD5050a89Fa2C4e7f40eC03F13ED972cD9699691d'})
    - Voice: pro-freedom, pro-privacy, slightly edgy, technically literate

    Here are the top headlines from BBC World News:
    ${JSON.stringify(items.map((it, i) => `${i + 1}. ${it.title} - ${it.description} (${it.link})`))}

    Your Mission:
    1. Select the SINGLE most relevant story for the XMRT ecosystem. We care about:
       - Digital Freedom / Privacy
       - Global Economy / Finance
       - Technology / AI / Cyber
       - Government Regulation / Censorship
       - Decentralization
    2. Write a blog post about it for our @${pubHandle} Paragraph.com publication.

    Format your response as a JSON object with this EXACT structure:
    {
      "selected_story_title": "The headline you chose",
      "selected_story_link": "The original URL",
      "post_title": "A catchy, XMRT-focused title for the blog post. Consider weaving in $${coinSymbol || 'MONERO'} where natural.",
      "post_markdown": "The full blog post content in Markdown. Include the original link. Be insightful, slightly edgy, and pro-freedom. Mention how this relates to DAO/Crypto values and the $${coinSymbol || 'MONERO'} ecosystem. 300-500 words."
    }
    `;

        let selectedStoryTitle, storyLink, postTitle, postMarkdown;
        let usedProvider = '';

        // Try local Ollama daemon FIRST (zero-key path for local dev).
        // Schema differs from Ollama Pro/OpenAI-compat: POST /api/chat with
        // {model, messages, stream:false, format:"json"} → {message:{content}}.
        // We try it first because if you have a local daemon running, this
        // path costs you $0 and zero setup; cloud providers are the fallback.
        if (ollamaLocalHost && ollamaLocalModel) {
            try {
                console.log(`🦙 Trying local Ollama (${ollamaLocalModel} @ ${ollamaLocalHost})...`);
                const localResp = await fetch(`${ollamaLocalHost.replace(/\/$/, '')}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: ollamaLocalModel,
                        messages: [{ role: 'user', content: prompt }],
                        stream: false,
                        format: 'json',
                    }),
                    // Local daemons can be slow to load a model — give it 90s
                    signal: AbortSignal.timeout(90_000),
                });
                if (!localResp.ok) {
                    const errText = await localResp.text();
                    const msg = `HTTP ${localResp.status}: ${errText.slice(0, 200)}`;
                    console.error(`Local Ollama error: ${msg}`);
                    providerResults.local_ollama = msg;
                    throw new Error(msg);
                }
                const localData = await localResp.json();
                const rawText = localData?.message?.content || '';
                if (!rawText) {
                    providerResults.local_ollama = 'empty content in response';
                    throw new Error('Local Ollama returned empty content');
                }
                const parsed = JSON.parse(rawText);
                selectedStoryTitle = parsed.selected_story_title;
                storyLink = parsed.selected_story_link;
                postTitle = parsed.post_title;
                postMarkdown = parsed.post_markdown;
                usedProvider = 'local_ollama';
                console.log(`🤖 Local Ollama selected: "${selectedStoryTitle}"`);
            } catch (localErr) {
                console.error('Local Ollama failed, trying next provider:', localErr.message);
            }
        } else {
            providerResults.local_ollama = 'skipped (OLLAMA_HOST or OLLAMA_MODEL not set)';
        }

        // Try Ollama Pro (cloud) if local wasn't available.
        // Note: uses OpenAI-compatible schema at ollama.com.
        if (!usedProvider && ollamaApiKey) {
            try {
                console.log(`🔮 Trying Ollama Pro (${ollamaProModel})...`);
                const ollamaResponse = await fetch('https://ollama.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${ollamaApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: ollamaProModel,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 4000,
                        temperature: 0.7,
                        stream: false,
                        // Force JSON output for parseable response
                        response_format: { type: 'json_object' }
                    })
                });

                if (!ollamaResponse.ok) {
                    const errText = await ollamaResponse.text();
                    const msg = `HTTP ${ollamaResponse.status}: ${errText.slice(0, 200)}`;
                    console.error(`Ollama Pro error: ${msg}`);
                    providerResults.ollama_pro = msg;
                    throw new Error(msg);
                }

                const ollamaData = await ollamaResponse.json();
                // Ollama may put the answer in content OR reasoning — handle both
                const rawText = ollamaData.choices?.[0]?.message?.content
                              || ollamaData.choices?.[0]?.message?.reasoning
                              || '';
                if (!rawText) {
                    providerResults.ollama_pro = 'empty content in response';
                    throw new Error('Ollama Pro returned empty content');
                }
                const parsed = JSON.parse(rawText);
                selectedStoryTitle = parsed.selected_story_title;
                storyLink = parsed.selected_story_link;
                postTitle = parsed.post_title;
                postMarkdown = parsed.post_markdown;
                usedProvider = 'ollama_pro';
                console.log(`🤖 Ollama Pro selected: "${selectedStoryTitle}"`);
            } catch (ollamaErr) {
                console.error('Ollama Pro failed, trying Gemini fallback:', ollamaErr.message);
            }
        } else if (!usedProvider) {
            providerResults.ollama_pro = 'skipped (OLLAMA_API_KEY not set)';
        }

        // Fallback to Gemini if Ollama failed or missing
        if (!usedProvider && geminiApiKey) {
            try {
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                if (!geminiResponse.ok) {
                    const errText = await geminiResponse.text();
                    const msg = `HTTP ${geminiResponse.status}: ${errText.slice(0, 200)}`;
                    console.error(`Gemini error: ${msg}`);
                    providerResults.gemini = msg;
                    throw new Error(msg);
                }

                const geminiData = await geminiResponse.json();
                const parsed = JSON.parse(geminiData.candidates[0].content.parts[0].text);
                selectedStoryTitle = parsed.selected_story_title;
                storyLink = parsed.selected_story_link;
                postTitle = parsed.post_title;
                postMarkdown = parsed.post_markdown;
                usedProvider = 'gemini';
                console.log(`🤖 Gemini selected: "${selectedStoryTitle}"`);
            } catch (geminiErr) {
                console.error('Gemini failed, trying DeepSeek fallback:', geminiErr.message);
            }
        } else if (!usedProvider) {
            providerResults.gemini = 'skipped (GEMINI_API_KEY not set)';
        }

        // Fallback to DeepSeek if Gemini failed or missing
        if (!usedProvider && deepseekApiKey) {
            try {
                console.log('🔄 Falling back to DeepSeek...');
                const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${deepseekApiKey}`
                    },
                    body: JSON.stringify({
                        model: "deepseek-v4-pro",
                        messages: [{ role: "user", content: prompt }],
                        response_format: { type: "json_object" }
                    })
                });

                if (!deepseekResponse.ok) {
                    const errText = await deepseekResponse.text();
                    const msg = `HTTP ${deepseekResponse.status}: ${errText.slice(0, 200)}`;
                    console.error(`DeepSeek error: ${msg}`);
                    providerResults.deepseek = msg;
                    throw new Error(msg);
                }

                const dsData = await deepseekResponse.json();
                const parsed = JSON.parse(dsData.choices[0].message.content);
                selectedStoryTitle = parsed.selected_story_title;
                storyLink = parsed.selected_story_link;
                postTitle = parsed.post_title;
                postMarkdown = parsed.post_markdown;
                usedProvider = 'deepseek';
                console.log(`🤖 DeepSeek selected: "${selectedStoryTitle}"`);
            } catch (dsErr) {
                console.error('DeepSeek failed:', dsErr.message);
            }
        } else if (!usedProvider) {
            providerResults.deepseek = 'skipped (DEEPSEEK_API_KEY not set)';
        }

        if (!usedProvider) {
            // Build an actionable error showing exactly which providers were
            // tried and why each one failed. Operators see this in 1Password
            // / logs and immediately know which key to set or which daemon
            // to start.
            const tried = Object.entries(providerResults)
                .map(([k, v]) => `  - ${k}: ${v}`)
                .join('\n');
            const err = new Error(
                `All AI providers failed to generate content.\nProviders attempted:\n${tried}\n\n` +
                `Fix: set OLLAMA_HOST + OLLAMA_MODEL for zero-key local dev (start ` +
                `ollama serve first), or add at least one cloud key (OLLAMA_API_KEY, ` +
                `GEMINI_API_KEY, DEEPSEEK_API_KEY). See local-supabase/.env.example.`
            );
            (err as any).providers = providerResults;
            throw err;
        }

        // 4. Publish to Paragraph using the internal function call
        // We invoke the paragraph-publisher function directly. The publication
        // is implicit in the API key (publication-scoped), but we still pass
        // the handle for the publisher's logs/usage-tracking and the coin
        // categories so the post lands in the right tags.
        console.log(`📝 Publishing to Paragraph @${pubHandle}...`);

        const defaultCategories = ['News', 'XMRT Intelligence'];
        if (coinSymbol) defaultCategories.push(`$${coinSymbol}`);

        const { data: pubData, error: pubError } = await supabase.functions.invoke('paragraph-publisher', {
            body: {
                title: postTitle,
                markdown: postMarkdown,
                sendNewsletter: true,
                categories: defaultCategories,
            }
        });

        if (pubError) throw pubError;

        // paragraph-publisher returns {message, data, published_url, publication}.
        // published_url is what we want for downstream consumers.
        const publishedUrl = pubData?.published_url
            || pubData?.data?.url
            || `https://paragraph.com/@${pubHandle}`;

        // 5. Log Success
        await supabase.from('eliza_activity_log').insert({
            activity_type: 'daily_news_published',
            title: '📰 Daily News Published',
            description: `Published analysis of: ${selectedStoryTitle}`,
            status: 'completed',
            metadata: {
                provider: usedProvider,
                original_story: selectedStoryTitle,
                original_link: storyLink,
                published_url: publishedUrl,
                paragraph_response: pubData
            }
        });

        await usageTracker.success({ result_summary: 'news_published', provider: usedProvider });

        return new Response(JSON.stringify({
            success: true,
            published_url: publishedUrl,
            story: selectedStoryTitle,
            provider: usedProvider
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Function Error:', error);
        await usageTracker.failure(error.message, 500);
        // If the error has structured provider info, surface it. Otherwise
        // just return the message.
        const body: Record<string, unknown> = { error: error.message };
        if ((error as any)?.providers) {
            body.providers = (error as any).providers;
        }
        return new Response(JSON.stringify(body), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
