import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import DecisionInput, DecisionOutput, ActionType, DecisionType
from pipeline.input_parser import parse_input
from pipeline.signal_engine import compute_signals
from pipeline.prompt_builder import build_prompt
from pipeline.output_parser import parse_output
from pipeline.decision_finalizer import finalize_decision
from scenarios import get_scenarios
from config import get_available_models

results = []

results.append("=== Test 1: Models ===")
di = DecisionInput(
    action="Set reminder: drink water at 3pm",
    latest_message="Remind me to drink water at 3pm",
    action_type=ActionType.SET_REMINDER,
)
results.append(f"DecisionInput: {di.action}, type={di.action_type}")

results.append("\n=== Test 2: Input Parser ===")
parsed = parse_input(di)
results.append(f"Parsed: action={parsed['action']}, type={parsed['action_type']}")

results.append("\n=== Test 3: Signal Engine ===")
signals = compute_signals(parsed)
results.append(f"Signals: risk={signals.action_risk_level}, irreversible={signals.is_irreversible}, external={signals.involves_external_party}, confirmation={signals.has_explicit_confirmation}")

results.append("\n=== Test 4: Prompt Builder ===")
prompt = build_prompt(parsed, signals)
results.append(f"Prompt length: {len(prompt)} chars")

results.append("\n=== Test 5: Output Parser ===")
llm_out, failed = parse_output("This is not JSON", "")
results.append(f"Malformed: decision={llm_out.decision}, failed={failed}")

llm_out2, failed2 = parse_output('{"decision": "EXECUTE_SILENTLY", "confidence": 0.9, "intent_resolved": true, "key_parameters": {}, "risk_assessment": "LOW", "rationale": "Clear intent"}', "")
results.append(f"Valid JSON: decision={llm_out2.decision}, confidence={llm_out2.confidence}, failed={failed2}")

results.append("\n=== Test 6: Scenarios ===")
scenarios = get_scenarios()
results.append(f"Scenarios count: {len(scenarios)}")
for s in scenarios:
    results.append(f"  [{s.id}] {s.title} ({s.category}) -> expected: {s.expected_decision}")

results.append("\n=== Test 7: Models ===")
models = get_available_models()
results.append(f"Models count: {len(models)}")
for m in models:
    results.append(f"  {m['id']} ({m['provider']}) - available: {m['available']}")

results.append("\n=== All tests passed! ===")

with open("pipeline_test_results.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))
print("Done")
