// XMRT AI Transformation Booth - Themed Prompt Library
// Clean-room build. Product spec reference: Fun Frame Photo ai_experience.html

export const THEMES = {
  "hollywood": {
    "name": "Hollywood Red Carpet",
    "prompt": "glamorous red carpet celebrity portrait, dramatic studio lighting, elegant evening gown, paparazzi flash ambiance, ultra high detail",
    "icon": "\ud83c\udfac"
  },
  "enchanted_forest": {
    "name": "Enchanted Forest",
    "prompt": "magical forest fantasy portrait, glowing fireflies, ethereal mist, bioluminescent flora, fairy-tale atmosphere, soft dreamy light",
    "icon": "\ud83c\udf32"
  },
  "steampunk": {
    "name": "Steampunk",
    "prompt": "steampunk portrait, brass goggles, Victorian-industrial clothing, gears and cogs, sepia copper tones, mechanical details",
    "icon": "\u2699\ufe0f"
  },
  "psychedelic": {
    "name": "Psychedelic",
    "prompt": "vibrant psychedelic portrait, swirling neon colors, trippy patterns, kaleidoscopic effects, bold surreal art style",
    "icon": "\ud83c\udf08"
  },
  "fairy": {
    "name": "Fairy",
    "prompt": "ethereal fairy portrait, gossamer wings, shimmering dust, pastel magical glow, delicate fantasy beauty",
    "icon": "\ud83e\uddda"
  },
  "superhero": {
    "name": "Superhero",
    "prompt": "epic superhero portrait, dynamic action pose, dramatic cape, comic-book art style, bold heroic lighting",
    "icon": "\ud83e\uddb8"
  },
  "custom": {
    "name": "Custom Prompt",
    "prompt": null,
    "icon": "\u2728"
  }
};

export function buildPrompt(themeKey, customPrompt) {
  const t = THEMES[themeKey];
  if (themeKey === 'custom') return customPrompt;
  return `Transform this person into a ${t.name.toLowerCase()} portrait. ${t.prompt}. Photorealistic, professional, high resolution.`;
}
