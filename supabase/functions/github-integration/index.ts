import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { action, data } = body;
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN') || Deno.env.get('GITHUB_TOKEN_PROOF_OF_LIFE');
    const GITHUB_OWNER = data?.owner || Deno.env.get('GITHUB_OWNER') || 'xmrtdao';
    if (!GITHUB_TOKEN) {
      return new Response(JSON.stringify({ success: false, error: 'GitHub token not configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const repo = (data?.repo || 'mobilemonero').replace(/^.*\//, '');
    let url = '', method = 'GET', ghBody;
    switch (action) {
      case 'list_issues': url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/issues?state=open&per_page=20`; break;
      case 'get_issue': url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/issues/${data?.issue_number || ''}`; break;
      case 'create_issue': url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/issues`; method = 'POST'; ghBody = { title: data?.title, body: data?.body || '' }; break;
      case 'list_prs': url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/pulls?state=open&per_page=20`; break;
      case 'search_code': url = `https://api.github.com/search/code?q=${encodeURIComponent(data?.query || '')}+repo:${GITHUB_OWNER}/${repo}`; break;
      case 'list_repos': url = `https://api.github.com/user/repos?per_page=20&sort=updated`; break;
      case 'list_org_repos': url = `https://api.github.com/orgs/${GITHUB_OWNER}/repos?per_page=20`; break;
      default: return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const ghRes = await fetch(url, {
      method, headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'XMRT-DAO-Relay' },
      body: ghBody ? JSON.stringify(ghBody) : undefined,
    });
    const ghData = await ghRes.json();
    return new Response(JSON.stringify({ success: ghRes.ok, data: ghData, status: ghRes.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: errMsg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
