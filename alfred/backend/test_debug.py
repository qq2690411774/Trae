import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from models import DecisionInput, ActionType, PipelineTrace
from pipeline.input_parser import parse_input
from pipeline.signal_engine import compute_signals
from pipeline.prompt_builder import build_prompt
from pipeline.llm_caller import call_llm
from pipeline.output_parser import parse_output
from pipeline.decision_finalizer import finalize_decision
import asyncio

async def test():
    di = DecisionInput(
        action="Create calendar event: team meeting Friday 2pm",
        latest_message="Schedule a team meeting on Friday at 2pm",
        conversation_history=[],
        action_type=ActionType.SCHEDULE_MEETING,
    )
    parsed = parse_input(di)
    signals = compute_signals(parsed)
    prompt = build_prompt(parsed, signals)
    raw_output, model_or_error = await call_llm(prompt, model_id="gpt-4o-mini")
    
    error = ""
    if model_or_error.startswith("LLM_") or model_or_error.startswith("MODEL_"):
        error = model_or_error
    
    llm_output, parse_failed = parse_output(raw_output, error)
    
    trace = PipelineTrace(
        inputs=parsed,
        signals=signals,
        prompt=prompt,
        raw_llm_output=raw_output,
        parsed_llm_output=llm_output,
        model_used="gpt-4o-mini",
        error=error if error else None,
        fallback_used=bool(error) or parse_failed,
    )
    
    trace = finalize_decision(llm_output, signals, trace)
    
    with open("s2_debug.txt", "w") as f:
        f.write(f"signals: risk={signals.action_risk_level} irr={signals.is_irreversible} ext={signals.involves_external_party} conf={signals.has_explicit_confirmation}\n")
        f.write(f"error={error}\n")
        f.write(f"llm_output.decision={llm_output.decision}\n")
        f.write(f"final_decision={trace.final_decision}\n")
        f.write(f"fallback={trace.fallback_used}\n")

asyncio.run(test())
