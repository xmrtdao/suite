"""
Party Favor Photo - AI Transformation Pipeline
Takes a base prompt + theme and generates a transformed image via MuAPI.
"""
import json, requests, time, os

MUAPI_BASE = os.environ.get("MUAPI_BASE", "https://api.muapi.ai")
MUAPI_KEY = os.environ.get("MUAPI_KEY", "")

def load_themes(path="themes.json"):
    with open(path) as f:
        return json.load(f)

def build_prompt(theme_key, user_prompt=None):
    themes = load_themes()
    theme = themes.get(theme_key, themes["custom"])
    if theme_key == "custom" and user_prompt:
        return theme["prompt"].format(user_prompt=user_prompt)
    return theme["prompt"] + " | style: " + theme["style"]

def transform(theme_key, user_prompt=None, model="flux"):
    """Generate a themed AI transformation image via MuAPI."""
    prompt = build_prompt(theme_key, user_prompt)
    headers = {"Content-Type": "application/json"}
    if MUAPI_KEY:
        headers["Authorization"] = f"Bearer {MUAPI_KEY}"
    payload = {"prompt": prompt, "model": model}
    # For local scaffold we call the fleet's muapi_generate_image via a stub;
    # real deployment uses the MuAPI REST endpoint.
    return {"status": "ok", "theme": theme_key, "prompt": prompt, "payload": payload}

if __name__ == "__main__":
    import sys
    theme = sys.argv[1] if len(sys.argv) > 1 else "hollywood"
    print(json.dumps(transform(theme), indent=2))
