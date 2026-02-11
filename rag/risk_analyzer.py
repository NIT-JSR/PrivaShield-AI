"""
PrivaShield AI - Risk Analyzer & Permission Mapper
Provides advanced privacy risk analysis and device-permission-to-policy mapping.
"""

import os
import json
import re
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

# Use the same LLM instance configuration as ai_engine
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.2)


# ──────────────────────────────────────────────
#  RISK ANALYSIS
# ──────────────────────────────────────────────

def analyze_risks(clean_text: str) -> dict:
    """
    Analyzes cleaned privacy policy text for critical privacy risks.
    Returns structured risk data including score, categories, and flags.
    """
    context = clean_text[:15000]

    prompt = f"""You are a senior privacy policy auditor. Analyze the following privacy policy text and return a JSON response.

You MUST return ONLY valid JSON, no markdown, no explanation, no code fences. Just raw JSON.

Return this exact structure:
{{
    "overall_risk_score": <number 1-10>,
    "risk_level": "<LOW|MEDIUM|HIGH|CRITICAL>",
    "data_collected": [
        {{"category": "<category name>", "items": ["<item1>", "<item2>"], "severity": "<low|medium|high>"}}
    ],
    "third_party_sharing": [
        {{"entity": "<company/type>", "purpose": "<why>", "data_shared": ["<what data>"]}}
    ],
    "hidden_clauses": [
        {{"clause": "<summary of the hidden/dangerous clause>", "risk": "<why this is dangerous>", "severity": "<medium|high|critical>"}}
    ],
    "user_rights": {{
        "can_delete_data": <true|false>,
        "can_opt_out": <true|false>,
        "data_portability": <true|false>,
        "consent_withdrawal": <true|false>,
        "details": "<brief explanation>"
    }},
    "retention_policy": "<how long data is kept>",
    "red_flags": ["<flag1>", "<flag2>"]
}}

Privacy Policy Text:
{context}
"""

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        # Try to extract JSON from the response
        content = _extract_json(content)
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        return {
            "overall_risk_score": 0,
            "risk_level": "UNKNOWN",
            "error": "Failed to parse AI response",
            "raw_response": response.content[:500] if response else ""
        }
    except Exception as e:
        return {
            "overall_risk_score": 0,
            "risk_level": "UNKNOWN",
            "error": f"AI Error: {str(e)}"
        }


# ──────────────────────────────────────────────
#  PERMISSION MAPPING
# ──────────────────────────────────────────────

DEVICE_PERMISSIONS = [
    "Camera",
    "Microphone",
    "Location (GPS)",
    "Contacts",
    "Storage / Files",
    "Notifications",
    "Background Activity Tracking",
    "Clipboard Access",
    "Biometric Data (Face / Fingerprint)",
    "Bluetooth / Nearby Devices",
    "Calendar",
    "Call Logs",
    "SMS / Messages",
    "Advertising ID / Cross-App Tracking",
    "Network / Wi-Fi Information"
]


def map_permissions(clean_text: str) -> dict:
    """
    Maps privacy policy text to device-level permissions.
    Explains what each permission is used for and consequences of denying it.
    """
    context = clean_text[:15000]
    permissions_list = ", ".join(DEVICE_PERMISSIONS)

    prompt = f"""You are a mobile privacy expert. Analyze the following privacy policy and map it to device-level permissions.

For each permission from this list: [{permissions_list}]

Determine if the policy indicates the app uses/requests that permission.

You MUST return ONLY valid JSON, no markdown, no explanation, no code fences. Just raw JSON.

Return this exact structure:
{{
    "permissions": [
        {{
            "name": "<permission name>",
            "requested": <true|false>,
            "confidence": "<high|medium|low>",
            "purpose": "<why the app needs this based on the policy>",
            "policy_evidence": "<exact quote or paraphrase from the policy>",
            "deny_consequence": "<what happens if user denies this permission>",
            "recommendation": "<ALLOW|DENY|CONDITIONAL>",
            "recommendation_reason": "<why this recommendation>"
        }}
    ],
    "total_permissions_requested": <number>,
    "unnecessary_permissions": ["<permission that seems excessive>"],
    "permission_risk_score": <number 1-10>
}}

Privacy Policy Text:
{context}
"""

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        content = _extract_json(content)
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        return {
            "permissions": [],
            "error": "Failed to parse AI response",
            "raw_response": response.content[:500] if response else ""
        }
    except Exception as e:
        return {
            "permissions": [],
            "error": f"AI Error: {str(e)}"
        }


# ──────────────────────────────────────────────
#  HIDDEN CLAUSE DETECTION
# ──────────────────────────────────────────────

def detect_hidden_clauses(clean_text: str) -> dict:
    """
    Specifically focuses on finding hidden, misleading, or dangerous clauses
    that average users would miss.
    """
    context = clean_text[:15000]

    prompt = f"""You are a consumer rights attorney specializing in digital privacy. 
Analyze this privacy policy and find ALL hidden, misleading, or dangerous clauses that an average user would miss.

Focus on:
1. Perpetual content ownership / license grants
2. Data selling to third parties (even if disguised)
3. Arbitration clauses that waive class-action rights
4. Auto-renewal / cancellation traps
5. Right to change terms without notice
6. Data retention after account deletion
7. Cross-device tracking
8. Sharing data with government/law enforcement without warrant
9. Using data for AI/ML training
10. Broad indemnification clauses

You MUST return ONLY valid JSON, no markdown, no explanation, no code fences. Just raw JSON.

Return this exact structure:
{{
    "hidden_clauses": [
        {{
            "title": "<short title>",
            "original_text": "<quote or close paraphrase from policy>",
            "plain_english": "<what this actually means for the user>",
            "severity": "<low|medium|high|critical>",
            "category": "<one of the 10 categories above>",
            "action_recommended": "<what the user should do>"
        }}
    ],
    "transparency_score": <1-10, where 10 is fully transparent>,
    "overall_assessment": "<one paragraph summary of how trustworthy this policy is>"
}}

Privacy Policy Text:
{context}
"""

    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        content = _extract_json(content)
        result = json.loads(content)
        return result
    except json.JSONDecodeError:
        return {
            "hidden_clauses": [],
            "error": "Failed to parse AI response",
            "raw_response": response.content[:500] if response else ""
        }
    except Exception as e:
        return {
            "hidden_clauses": [],
            "error": f"AI Error: {str(e)}"
        }


# ──────────────────────────────────────────────
#  FULL DETAILED ANALYSIS
# ──────────────────────────────────────────────

def full_analysis(clean_text: str) -> dict:
    """
    Runs all analysis pipelines and returns a combined result.
    """
    risks = analyze_risks(clean_text)
    permissions = map_permissions(clean_text)
    hidden = detect_hidden_clauses(clean_text)

    return {
        "risk_analysis": risks,
        "permission_mapping": permissions,
        "hidden_clauses_analysis": hidden
    }


# ──────────────────────────────────────────────
#  UTILITY
# ──────────────────────────────────────────────

def _extract_json(text: str) -> str:
    """
    Extracts JSON from a response that might contain markdown code fences or extra text.
    """
    # Try to find JSON in code fences first
    json_match = re.search(r'```(?:json)?\s*\n?([\s\S]*?)\n?```', text)
    if json_match:
        return json_match.group(1).strip()

    # Try to find raw JSON (starts with { and ends with })
    brace_start = text.find('{')
    brace_end = text.rfind('}')
    if brace_start != -1 and brace_end != -1:
        return text[brace_start:brace_end + 1]

    return text
