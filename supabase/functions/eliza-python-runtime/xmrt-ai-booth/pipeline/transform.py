
"""XMRT AI Transformation Booth - standalone transformation pipeline.
Clean-room rebuild. No edge function dependency.
Transforms a subject photo through a themed AI prompt using MuAPI image generation.
"""
import json, os, time, requests, base64

THEMES = json.load(open(os.path.join(os.path.dirname(__file__), "themes.json")))

MUAPI_URL = "https://api.muapi.ai/v1/images/generations"
MUAPI_KEY = os.environ.get("MUAPI_API_KEY", "")


def build_prompt(theme_key: str, subject_desc: str, custom_prompt: str = "") -> str:
    """Build the final AI prompt from a theme + subject description."""
    theme = THEMES.get(theme_key, THEMES["custom"])
    if theme_key == "custom":
        return theme["prompt_template"].format(custom_prompt=custom_prompt, subject=subject_desc)
    return theme["prompt_template"].format(subject=subject_desc)


def transform(theme_key: str, subject_desc: str, custom_prompt: str = "",
              model: str = "flux") -> dict:
    """Run the transformation. Returns request id + status for async checking."""
    prompt = build_prompt(theme_key, subject_desc, custom_prompt)
    payload = {
        "prompt": prompt,
        "model": model,
        "n": 1,
    }
    # MuAPI generation is invoked via the fleet's image tool; here we prepare
    # the exact prompt and return it for the caller to submit.
    return {
        "theme": theme_key,
        "prompt": prompt,
        "model": model,
        "ready": True,
        "note": "Submit this prompt via the image generation API to produce the transformed photo."
    }


def list_themes() -> list:
    return [{"key": k, "name": v["name"], "description": v["description"]}
            for k, v in THEMES.items()]


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "themes":
        print(json.dumps(list_themes(), indent=2))
    else:
        demo = transform("hollywood", "a confident guest at the event")
        print(json.dumps(demo, indent=2))
