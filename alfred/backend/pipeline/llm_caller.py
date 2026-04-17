import asyncio
import json
from openai import AsyncOpenAI
from config import get_model_config, DEFAULT_MODEL, LLM_TIMEOUT, LLM_MAX_RETRIES
from models import LLMOutput, DecisionType, RiskLevel


async def call_llm(prompt: str, model_id: str = None, simulate_timeout: bool = False, simulate_malformed: bool = False) -> tuple[str, str]:
    if simulate_timeout:
        await asyncio.sleep(LLM_TIMEOUT + 5)
        return "", "LLM_TIMEOUT"

    if simulate_malformed:
        return "I think this should be confirmed before sending. The user seems unsure.", ""

    mid = model_id or DEFAULT_MODEL
    model_config = get_model_config(mid)

    if not model_config or not model_config.get("api_key"):
        return "", f"MODEL_NOT_CONFIGURED:{mid}"

    client = AsyncOpenAI(
        api_key=model_config["api_key"],
        base_url=model_config["base_url"],
    )

    messages = []
    parts = prompt.split("\n\nUser:\n", 1)
    if len(parts) == 2:
        messages.append({"role": "system", "content": parts[0]})
        messages.append({"role": "user", "content": parts[1]})
    else:
        messages.append({"role": "user", "content": prompt})

    last_error = None
    for attempt in range(LLM_MAX_RETRIES + 1):
        try:
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model_config["model_name"],
                    messages=messages,
                    temperature=0.1,
                    max_tokens=500,
                ),
                timeout=LLM_TIMEOUT,
            )
            raw_output = response.choices[0].message.content.strip()
            return raw_output, model_config["model_name"]
        except asyncio.TimeoutError:
            return "", "LLM_TIMEOUT"
        except Exception as e:
            last_error = str(e)
            if attempt < LLM_MAX_RETRIES:
                await asyncio.sleep(0.5)

    return "", f"LLM_ERROR:{last_error}"
