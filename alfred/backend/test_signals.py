import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from models import DecisionInput, ActionType
from pipeline.input_parser import parse_input
from pipeline.signal_engine import compute_signals

di = DecisionInput(
    action="Create calendar event: team meeting Friday 2pm",
    latest_message="Schedule a team meeting on Friday at 2pm",
    conversation_history=[],
    action_type=ActionType.SCHEDULE_MEETING,
)
parsed = parse_input(di)
signals = compute_signals(parsed)
with open("s2_signals.txt", "w") as f:
    f.write(f"risk={signals.action_risk_level}\nirreversible={signals.is_irreversible}\nexternal={signals.involves_external_party}\nconfirmation={signals.has_explicit_confirmation}\n")

di2 = DecisionInput(
    action="Create calendar event: quarterly review",
    latest_message="Schedule the quarterly review for next Monday",
    conversation_history=[],
    action_type=ActionType.CREATE_CALENDAR,
    simulate_timeout=True,
)
parsed2 = parse_input(di2)
signals2 = compute_signals(parsed2)
with open("s7_signals.txt", "w") as f:
    f.write(f"risk={signals2.action_risk_level}\nirreversible={signals2.is_irreversible}\nexternal={signals2.involves_external_party}\nconfirmation={signals2.has_explicit_confirmation}\n")
