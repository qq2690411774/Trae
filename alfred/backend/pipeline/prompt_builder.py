from models import SignalResult
import json


SYSTEM_PROMPT = """You are alfred_'s Execution Decision Engine. Given a proposed action and context, decide which execution strategy to take.

## Available Decisions
1. EXECUTE_SILENTLY - Execute without notifying the user
2. EXECUTE_AND_TELL - Execute and notify the user after
3. CONFIRM_FIRST - Ask for user confirmation before executing
4. ASK_CLARIFYING - Ask a clarifying question (intent, entity, or key parameters unresolved)
5. REFUSE_ESCALATE - Refuse the action or escalate to human

## Decision Boundaries
- ASK_CLARIFYING when intent, entity, or key parameters are unresolved.
- CONFIRM_FIRST when intent is resolved but risk is above the silent execution threshold.
- REFUSE_ESCALATE when policy disallows the action, or risk/uncertainty remains too high even after clarification.

## Deterministic Signals (pre-computed by code)
{signals}

## Output Format (strict JSON, no markdown, no extra text)
{{
  "decision": "<one of: EXECUTE_SILENTLY, EXECUTE_AND_TELL, CONFIRM_FIRST, ASK_CLARIFYING, REFUSE_ESCALATE>",
  "confidence": <float 0-1>,
  "intent_resolved": <bool>,
  "key_parameters": {{<param_name>: <bool resolved>}},
  "risk_assessment": "<LOW, MEDIUM, or HIGH>",
  "rationale": "<concise reason>"
}}"""


def build_prompt(parsed_input: dict, signals: SignalResult) -> str:
    signals_dict = {
        "action_risk_level": signals.action_risk_level.value,
        "has_conversation_history": signals.has_conversation_history,
        "user_trust_level": signals.user_trust_level,
        "is_irreversible": signals.is_irreversible,
        "involves_external_party": signals.involves_external_party,
        "has_explicit_confirmation": signals.has_explicit_confirmation,
        "history_message_count": signals.history_message_count,
        "has_contradictory_signals": signals.has_contradictory_signals,
    }

    system = SYSTEM_PROMPT.format(signals=json.dumps(signals_dict, indent=2))

    history_text = ""
    for i, msg in enumerate(parsed_input.get("conversation_history", [])):
        history_text += f"  [{i+1}] {msg}\n"

    user = f"""Action: {parsed_input['action']}
Latest message: {parsed_input['latest_message']}
Conversation history:
{history_text if history_text else '  (none)'}"""

    return f"{system}\n\nUser:\n{user}"
