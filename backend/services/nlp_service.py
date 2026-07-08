"""
NLP Service — Google Gemini API Integration

Uses Gemini ONLY for:
  1. Complaint classification (category, urgency, sentiment)
  2. Entity extraction (location, issue type, financial impact)
  3. Translation to English
  4. Plain-language summary generation (grounded in score_breakdown data)

Gemini NEVER computes scores, selects projects, or invents data not present in inputs.
All inputs sent to Gemini are logged for auditability.
"""
import json
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class NLPService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.gemini_api_key
        self.client_ready = False
        self.model_name = "gemini-1.5-flash"

        if self.api_key and GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(self.model_name)
                self.client_ready = True
                logger.info(f"Gemini client initialized (model: {self.model_name})")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
        else:
            logger.warning("Gemini API key not set or SDK missing — using mock NLP responses.")

    def classify_complaint(self, raw_text: str, language: str = "auto") -> Dict[str, Any]:
        """
        Classify a complaint: extract category, urgency, sentiment, entities, and translate.
        Returns strict JSON. If Gemini unavailable, returns rule-based mock.
        """
        if not self.client_ready:
            return self._mock_classify(raw_text)

        prompt = f"""You are a complaint classification assistant for an Indian constituency management system.
Analyze the given citizen complaint and return ONLY a JSON object with this exact schema:
{{
  "translated_text": "English translation of the complaint (or original if already English)",
  "language_detected": "ISO 639-1 code (e.g. hi, mr, en, ta)",
  "issue_category": "one of: water | roads | health | education | sanitation | electricity | housing | other",
  "urgency": "one of: low | medium | high | critical",
  "sentiment": <float between -1.0 (very negative) and 1.0 (very positive)>,
  "entities": {{
    "location": "<extracted location name or null>",
    "issue_type": "<specific issue description>",
    "financial_impact": "<any mentioned financial impact or null>",
    "health_impact": <true or false>,
    "seasonal_risk": "<monsoon/winter/summer if mentioned, else null>"
  }},
  "confidence": <float 0.0-1.0>
}}
Return ONLY the JSON object. No markdown formatting (like ```json), no extra text.

Complaint:
{raw_text}"""

        input_payload = {"raw_text": raw_text, "language": language}

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                )
            )
            
            # Gemini sometimes wraps in ```json ... ``` despite instructions
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            result = json.loads(text.strip())
            result["_gemini_input_log"] = input_payload
            result["_model"] = self.model_name
            return result
        except Exception as e:
            logger.error(f"Gemini classify error: {e}")
            return self._mock_classify(raw_text)

    def generate_project_summary(
        self,
        project: Dict[str, Any],
        ward: Dict[str, Any],
        scheme: Optional[Dict[str, Any]],
        complaint_samples: list,
    ) -> Dict[str, Any]:
        """
        Generate a plain-language executive summary for a project.
        """
        if not self.client_ready:
            return self._mock_summary(project)

        score_breakdown_text = "\n".join([
            f"  - {factor}: {data.get('weighted_score', 0):.1f}/25 pts "
            f"(weight {data.get('weight', 0)*100:.0f}%) — {data.get('description', '')}"
            for factor, data in (project.get("score_breakdown") or {}).items()
        ])

        scheme_text = (
            f"Matched scheme: {scheme['name']} ({scheme.get('short_name', '')}) — "
            f"co-funds {scheme.get('cofunding_pct', 0):.0f}% (₹{project.get('scheme_cofunding_lakhs', 0):.1f}L of ₹{project.get('estimated_cost_lakhs', 0):.1f}L total)"
            if scheme else "No matching government scheme identified — fully MPLADS funded."
        )

        complaint_text = "\n".join([
            f'  - "{c.get("translated_text", c.get("raw_text", ""))[:120]}" (urgency: {c.get("urgency", "?")}, channel: {c.get("channel", "?")})'
            for c in complaint_samples[:3]
        ])

        structured_input = {
            "project_name": project.get("name"),
            "category": project.get("category"),
            "ward": ward.get("name"),
            "priority_score": project.get("priority_score"),
            "population_affected": project.get("population_affected"),
            "estimated_cost_lakhs": project.get("estimated_cost_lakhs"),
            "net_cost_lakhs": project.get("net_cost_lakhs"),
            "delay_risk": project.get("delay_risk"),
            "infra_evidence": project.get("infra_evidence"),
            "score_breakdown": score_breakdown_text,
            "scheme": scheme_text,
            "sample_complaints": complaint_text,
        }

        prompt = f"""You are an AI assistant helping an Indian Member of Parliament understand development project priorities.
Write a concise, plain-language executive summary (3-4 sentences, max 120 words) for the given project.

STRICT RULES:
1. Only use numbers and facts explicitly present in the structured data provided.
2. Do NOT invent percentages, costs, or statistics not given to you.
3. Do NOT make predictions beyond what the data supports.
4. Write in clear English accessible to a non-technical official.
5. Return ONLY a JSON object: {{"summary": "<your 3-4 sentence summary>"}}
No markdown formatting, no extra text.

Data:
Project: {structured_input['project_name']}
Category: {structured_input['category']}
Ward: {structured_input['ward']}
Priority Score: {structured_input['priority_score']}/100
Population Affected: {structured_input['population_affected']:,}
Estimated Cost: ₹{structured_input['estimated_cost_lakhs']}L total | ₹{structured_input['net_cost_lakhs']}L MPLADS net
Delay Risk: {structured_input['delay_risk']}
Infrastructure Evidence: {structured_input['infra_evidence']}
Scheme: {structured_input['scheme']}
Score Breakdown:
{structured_input['score_breakdown']}
Sample Citizen Complaints:
{structured_input['sample_complaints']}"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(temperature=0.2)
            )
            
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            result = json.loads(text.strip())
            return {
                "summary": result.get("summary", ""),
                "_model": self.model_name,
                "_input_log": structured_input,
                "_source": "gemini-generated",
            }
        except Exception as e:
            logger.error(f"Gemini summary error: {e}")
            return self._mock_summary(project)

    def _mock_classify(self, raw_text: str) -> Dict[str, Any]:
        """Deterministic mock classification when Gemini is unavailable."""
        text_lower = raw_text.lower()
        if any(w in text_lower for w in ["water", "pani", "nali", "drain"]):
            category, urgency = "water", "high"
        elif any(w in text_lower for w in ["road", "sadak", "pothole"]):
            category, urgency = "roads", "high"
        elif any(w in text_lower for w in ["hospital", "doctor", "health", "beemar"]):
            category, urgency = "health", "medium"
        elif any(w in text_lower for w in ["school", "education", "computer"]):
            category, urgency = "education", "medium"
        elif any(w in text_lower for w in ["light", "bijli", "electricity"]):
            category, urgency = "electricity", "medium"
        else:
            category, urgency = "other", "medium"

        return {
            "translated_text": raw_text,
            "language_detected": "en",
            "issue_category": category,
            "urgency": urgency,
            "sentiment": -0.6,
            "entities": {"location": None, "issue_type": category, "health_impact": False, "seasonal_risk": None},
            "confidence": 0.7,
            "_source": "mock (Gemini API key not set)",
        }

    def _mock_summary(self, project: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic mock summary when Gemini is unavailable."""
        score = project.get("priority_score", 0)
        name = project.get("name", "This project")
        pop = project.get("population_affected", 0)
        cost = project.get("net_cost_lakhs", 0)
        risk = project.get("delay_risk", "medium")

        summary = (
            f"{name} has a priority score of {score:.1f}/100, making it one of the highest-priority "
            f"interventions in the constituency. It will directly benefit {pop:,} residents at a net MPLADS "
            f"cost of ₹{cost:.1f} lakh after scheme co-funding. The delay risk is assessed as {risk}, "
            f"meaning early action is advisable to avoid cost escalation and worsening service gaps."
        )
        return {
            "summary": summary,
            "_model": "mock",
            "_input_log": {"project_id": project.get("id")},
            "_source": "mock (Gemini API key not set)",
        }
