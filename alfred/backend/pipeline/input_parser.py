from models import DecisionInput, SignalResult


def parse_input(raw_input: DecisionInput) -> dict:
    return {
        "action": raw_input.action.strip(),
        "latest_message": raw_input.latest_message.strip(),
        "conversation_history": [h.strip() for h in raw_input.conversation_history if h.strip()],
        "user_state": raw_input.user_state or {},
        "action_type": raw_input.action_type.value,
        "model_id": raw_input.model_id,
        "simulate_timeout": raw_input.simulate_timeout,
        "simulate_malformed": raw_input.simulate_malformed,
    }
