import os
import json
import re
import asyncio
from typing import AsyncGenerator, List
from google import genai
from google.genai import errors
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))

# Use 2.5 Flash as it is confirmed available in your dashboard
MODEL_NAME = "gemini-2.5-flash"

# Fallback data for when the 20-request daily limit is hit
MOCK_RESULT = {
    "risk_score": 55,
    "risk_label": "Medium risk",
    "cards": [
        {"type": "warning", "text": "AI Quota Limit: You have reached your daily limit of 20 requests. This is a placeholder analysis."},
        {"type": "safe", "text": "Service Continuity: The app is still running in fallback mode so you can test the UI."},
        {"type": "neutral", "text": "Tip: Upgrade to a paid plan in Google AI Studio to increase your daily limit."}
    ]
}



def _risk_label(score: int) -> str:
    if score <= 33:
        return "Low risk"
    elif score <= 66:
        return "Medium risk"
    return "High risk"


async def analyze_contract(text: str) -> dict:
    """Call Gemini for card analysis. Returns dict with risk_score and cards."""
    prompt = (
        "You are an expert legal analyst. Analyze the contract and return ONLY a JSON object. "
        "IMPORTANT: This is AI-generated insight for informational purposes only and is NOT professional legal advice. "
        "Strictly analyze only the provided contract text. "
        '{ "risk_score": integer 0-100, "cards": [{ "type": "warning"|"safe"|"neutral", '
        '"text": "1-2 sentence plain-English description" }] }. '
        "Generate 4–8 cards. High-risk items: unlimited liability, IP assignment, auto-renewal traps, non-compete. "
        "Safe items: reasonable notice, mutual termination. Neutral: jurisdiction, standard payment terms. "
        "Return ONLY valid JSON.\n\n"
        f"CONTRACT:\n{text[:8000]}"
    )

    try:
        # The new SDK is synchronous by default, we can wrap it or use its async methods if available.
        # For now, keeping the run_in_executor pattern or using the new SDK's async client if it exists.
        # The google-genai SDK has an async client as well.
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, lambda: client.models.generate_content(model=MODEL_NAME, contents=prompt)
        )

        raw = response.text.replace("```json", "").replace("```", "").strip()
        
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end != 0:
            raw = raw[start:end]

        data = json.loads(raw)
        return {
            "risk_score": int(data.get("risk_score", 50)),
            "risk_label": _risk_label(int(data.get("risk_score", 50))),
            "cards": data.get("cards", []),
        }
    except errors.APIError as e:
        if e.code == 429:
            print("[QUOTA] Gemini 2.5 Flash daily limit reached. Using fallback.")
            return MOCK_RESULT
        print(f"[ERROR] Gemini API error ({e.code}): {e.message}")
        # Instead of MOCK_RESULT, let the exception bubble up or raise a specific one
        # so we don't mislead the user with "quota exceeded" if it's actually an "invalid key" error.
        raise e
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        raise e


async def stream_summary(text: str, score: int, findings: List[dict]) -> AsyncGenerator[str, None]:
    """Stream a plain-English summary from Gemini."""
    findings_text = "; ".join(
        f"[{c.get('type','neutral').upper()}] {c.get('text','')}" for c in findings
    )
    prompt = (
        f"Write a 3–4 sentence plain-English summary of this contract for a non-lawyer. "
        "GUARDRAIL: You are an AI assistant, not a lawyer. This is NOT legal advice. "
        f"Risk score: {score}/100. Findings: {findings_text}. "
        "Be direct about the biggest risks. End with a mandatory strong disclaimer that this is AI insight and they MUST consult a legal professional before taking any action. "
        "No bullet points, flowing prose only.\n\n"
        f"CONTRACT:\n{text[:8000]}"
    )

    loop = asyncio.get_event_loop()
    response_stream = await loop.run_in_executor(
        None, lambda: client.models.generate_content_stream(model=MODEL_NAME, contents=prompt)
    )

    for chunk in response_stream:
        try:
            if chunk.text:
                yield chunk.text
        except ValueError:
            pass
