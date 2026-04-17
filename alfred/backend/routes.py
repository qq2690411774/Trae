import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models import (
    DecisionInput, DecisionOutput, PipelineTrace, LLMOutput,
    DecisionType, Scenario, ModelInfo,
)
from pipeline.input_parser import parse_input
from pipeline.signal_engine import compute_signals
from pipeline.prompt_builder import build_prompt
from pipeline.llm_caller import call_llm
from pipeline.output_parser import parse_output
from pipeline.decision_finalizer import finalize_decision
from scenarios import get_scenarios, get_scenario_by_id
from config import get_available_models, set_api_key, DEFAULT_MODEL

router = APIRouter()


class ApiKeyInput(BaseModel):
    env_var: str
    api_key: str


async def run_pipeline(decision_input: DecisionInput) -> DecisionOutput:
    parsed = parse_input(decision_input)

    signals = compute_signals(parsed)

    prompt = build_prompt(parsed, signals)

    model_id = decision_input.model_id or DEFAULT_MODEL
    raw_output, model_or_error = await call_llm(
        prompt,
        model_id=model_id,
        simulate_timeout=decision_input.simulate_timeout,
        simulate_malformed=decision_input.simulate_malformed,
    )

    error = ""
    model_used = model_id
    if model_or_error.startswith("LLM_") or model_or_error.startswith("MODEL_"):
        error = model_or_error
        model_used = model_id
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

    return DecisionOutput(
        decision=trace.final_decision,
        confidence=llm_output.confidence,
        rationale=trace.final_rationale,
        risk_assessment=llm_output.risk_assessment,
        intent_resolved=llm_output.intent_resolved,
        key_parameters=llm_output.key_parameters,
        model_used=trace.model_used,
        fallback_used=trace.fallback_used,
        pipeline_trace=trace,
    )


@router.post("/decision", response_model=DecisionOutput)
async def make_decision(decision_input: DecisionInput):
    result = await run_pipeline(decision_input)
    return result


@router.get("/scenarios", response_model=list[Scenario])
async def list_scenarios():
    return get_scenarios()


@router.post("/decision/scenario/{scenario_id}", response_model=DecisionOutput)
async def run_scenario(scenario_id: int, model_id: str = None):
    scenario = get_scenario_by_id(scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail=f"Scenario {scenario_id} not found")

    decision_input = scenario.input
    if model_id:
        decision_input.model_id = model_id

    result = await run_pipeline(decision_input)
    return result


@router.get("/models", response_model=list[ModelInfo])
async def list_models():
    return get_available_models()


@router.post("/models/api-key")
async def configure_api_key(api_key_input: ApiKeyInput):
    valid_env_vars = {
        "OPENAI_API_KEY", "ZHIPU_API_KEY", "MINIMAX_API_KEY",
        "DOUBAO_API_KEY", "MOONSHOT_API_KEY", "DASHSCOPE_API_KEY",
    }
    if api_key_input.env_var not in valid_env_vars:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid env_var. Must be one of: {', '.join(sorted(valid_env_vars))}",
        )
    set_api_key(api_key_input.env_var, api_key_input.api_key)
    updated_models = get_available_models()
    newly_available = [m for m in updated_models if m["api_key_env"] == api_key_input.env_var]
    return {
        "status": "ok",
        "env_var": api_key_input.env_var,
        "configured": bool(api_key_input.api_key),
        "models_updated": newly_available,
    }


@router.get("/health")
async def health():
    return {"status": "ok"}
