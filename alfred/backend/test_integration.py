import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
import json
from models import DecisionInput, ActionType, DecisionType, PipelineTrace
from pipeline.input_parser import parse_input
from pipeline.signal_engine import compute_signals
from pipeline.prompt_builder import build_prompt
from pipeline.llm_caller import call_llm
from pipeline.output_parser import parse_output
from pipeline.decision_finalizer import finalize_decision
from scenarios import get_scenarios

async def run_full_pipeline(decision_input: DecisionInput) -> dict:
    parsed = parse_input(decision_input)
    signals = compute_signals(parsed)
    prompt = build_prompt(parsed, signals)
    raw_output, model_or_error = await call_llm(
        prompt,
        model_id=decision_input.model_id or "gpt-4o-mini",
        simulate_timeout=decision_input.simulate_timeout,
        simulate_malformed=decision_input.simulate_malformed,
    )
    error = ""
    model_used = decision_input.model_id or "gpt-4o-mini"
    if model_or_error.startswith("LLM_") or model_or_error.startswith("MODEL_"):
        error = model_or_error
    else:
        model_used = model_or_error

    llm_output, parse_failed = parse_output(raw_output, error)

    trace = PipelineTrace(
        inputs=parsed,
        signals=signals,
        prompt=prompt,
        raw_llm_output=raw_output,
        parsed_llm_output=llm_output,
        model_used=model_used,
        error=error if error else None,
        fallback_used=bool(error) or parse_failed,
    )

    trace = finalize_decision(llm_output, signals, trace)

    return {
        "final_decision": trace.final_decision.value,
        "fallback_used": trace.fallback_used,
        "error": trace.error,
    }

async def main():
    lines = []
    scenarios = get_scenarios()

    for s in scenarios:
        result = await run_full_pipeline(s.input)
        expected = s.expected_decision.value
        actual = result["final_decision"]
        match = "PASS" if actual == expected else "MISMATCH"
        lines.append(f"{match} | S{s.id} ({s.category}) | expected={expected} got={actual} fallback={result['fallback_used']} err={result['error']}")

    with open("int_test.txt", "w") as f:
        f.write("\n".join(lines))

asyncio.run(main())
