import json
import re
from models import LLMOutput, DecisionType, RiskLevel


def _extract_json(text: str) -> str:
    match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
    if match:
        return match.group(0)

    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]

    return ""


def _normalize_decision(raw: str) -> DecisionType:
    raw_upper = raw.upper().strip()
    mapping = {
        "EXECUTE_SILENTLY": DecisionType.EXECUTE_SILENTLY,
        "EXECUTE_AND_TELL": DecisionType.EXECUTE_AND_TELL,
        "CONFIRM_FIRST": DecisionType.CONFIRM_FIRST,
        "ASK_CLARIFYING": DecisionType.ASK_CLARIFYING,
        "REFUSE_ESCALATE": DecisionType.REFUSE_ESCALATE,
    }
    for key, value in mapping.items():
        if key in raw_upper:
            return value
    return DecisionType.CONFIRM_FIRST


def _normalize_risk(raw: str) -> RiskLevel:
    raw_upper = raw.upper().strip()
    if "LOW" in raw_upper:
        return RiskLevel.LOW
    if "HIGH" in raw_upper:
        return RiskLevel.HIGH
    return RiskLevel.MEDIUM


def parse_output(raw_output: str, error: str) -> tuple[LLMOutput, bool]:
    if error:
        return LLMOutput(), True

    if not raw_output.strip():
        return LLMOutput(), True

    json_str = _extract_json(raw_output)

    if not json_str:
        return LLMOutput(
            decision=_normalize_decision(raw_output),
            rationale=raw_output[:200],
        ), False

    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        try:
            fixed = json_str.replace("'", '"')
            data = json.loads(fixed)
        except json.JSONDecodeError:
            return LLMOutput(
                decision=_normalize_decision(raw_output),
                rationale=raw_output[:200],
            ), False

    decision = _normalize_decision(data.get("decision", "CONFIRM_FIRST"))
    confidence = float(data.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))

    intent_resolved = bool(data.get("intent_resolved", False))
    key_parameters = {}
    raw_params = data.get("key_parameters", {})
    if isinstance(raw_params, dict):
        key_parameters = {k: bool(v) for k, v in raw_params.items()}

    risk_assessment = _normalize_risk(data.get("risk_assessment", "MEDIUM"))
    rationale = str(data.get("rationale", ""))

    return LLMOutput(
        decision=decision,
        confidence=confidence,
        intent_resolved=intent_resolved,
        key_parameters=key_parameters,
        risk_assessment=risk_assessment,
        rationale=rationale,
    ), False
