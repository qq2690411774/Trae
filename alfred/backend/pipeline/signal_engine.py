from models import DecisionInput, SignalResult, ActionType, RiskLevel

CONFIRMATION_WORDS = [
    "yes", "yep", "yeah", "sure", "ok", "okay", "send it", "go ahead", "do it",
    "confirm", "approved", "proceed", "go for it", "发吧", "确认", "发送吧",
    "好的", "可以", "没问题", "执行吧", "同意", "就这样", "发吧",
]

HOLD_WORDS = [
    "wait", "hold", "hold off", "stop", "cancel", "not yet", "don't",
    "等一下", "等等", "先别", "暂停", "取消", "不要",
]

ACTION_RISK_MAP = {
    ActionType.SEND_EMAIL: {
        "risk_level": RiskLevel.HIGH,
        "is_irreversible": True,
        "involves_external": True,
    },
    ActionType.DRAFT_EMAIL: {
        "risk_level": RiskLevel.LOW,
        "is_irreversible": False,
        "involves_external": False,
    },
    ActionType.CREATE_CALENDAR: {
        "risk_level": RiskLevel.LOW,
        "is_irreversible": False,
        "involves_external": True,
    },
    ActionType.DELETE_CALENDAR: {
        "risk_level": RiskLevel.MEDIUM,
        "is_irreversible": True,
        "involves_external": True,
    },
    ActionType.SET_REMINDER: {
        "risk_level": RiskLevel.LOW,
        "is_irreversible": False,
        "involves_external": False,
    },
    ActionType.DELETE_REMINDER: {
        "risk_level": RiskLevel.LOW,
        "is_irreversible": False,
        "involves_external": False,
    },
    ActionType.SCHEDULE_MEETING: {
        "risk_level": RiskLevel.MEDIUM,
        "is_irreversible": False,
        "involves_external": True,
    },
    ActionType.OTHER: {
        "risk_level": RiskLevel.MEDIUM,
        "is_irreversible": False,
        "involves_external": False,
    },
}


def _detect_confirmation(text: str) -> bool:
    lower = text.lower().strip()
    for word in CONFIRMATION_WORDS:
        if word in lower:
            return True
    return False


def _detect_hold(text: str) -> bool:
    lower = text.lower().strip()
    for word in HOLD_WORDS:
        if word in lower:
            return True
    return False


def _detect_contradictory_signals(history: list[str]) -> bool:
    has_hold = False
    has_confirm = False
    for msg in history:
        if _detect_hold(msg):
            has_hold = True
        if _detect_confirmation(msg):
            has_confirm = True
    return has_hold and has_confirm


def compute_signals(parsed_input: dict) -> SignalResult:
    action_type_str = parsed_input.get("action_type", "other")
    try:
        action_type = ActionType(action_type_str)
    except ValueError:
        action_type = ActionType.OTHER

    risk_config = ACTION_RISK_MAP.get(action_type, ACTION_RISK_MAP[ActionType.OTHER])

    history = parsed_input.get("conversation_history", [])
    latest_message = parsed_input.get("latest_message", "")
    user_state = parsed_input.get("user_state", {})

    has_confirmation = _detect_confirmation(latest_message)
    has_contradictory = _detect_contradictory_signals(history)

    trust_level = user_state.get("trust_level", "medium")

    return SignalResult(
        action_risk_level=risk_config["risk_level"],
        has_conversation_history=len(history) > 0,
        user_trust_level=trust_level,
        is_irreversible=risk_config["is_irreversible"],
        involves_external_party=risk_config["involves_external"],
        has_explicit_confirmation=has_confirmation,
        history_message_count=len(history),
        has_contradictory_signals=has_contradictory,
    )
