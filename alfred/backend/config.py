import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv(override=False)

_runtime_api_keys: dict[str, str] = {}

LLM_MODELS = {
    "glm-5.1": {
        "name": "GLM-5.1",
        "provider": "ZhipuAI",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "api_key_env": "ZHIPU_API_KEY",
        "model_name": "glm-5.1",
    },
    "glm-5v-turbo": {
        "name": "GLM-5V-Turbo",
        "provider": "ZhipuAI",
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "api_key_env": "ZHIPU_API_KEY",
        "model_name": "glm-5v-turbo",
    },
    "gpt-4o-mini": {
        "name": "GPT-4o-mini",
        "provider": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "model_name": "gpt-4o-mini",
    },
}

DEFAULT_MODEL = "glm-5.1"

LLM_TIMEOUT = 30
LLM_MAX_RETRIES = 1

CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:5174"]


def _get_api_key(env_var: str) -> str:
    if env_var in _runtime_api_keys and _runtime_api_keys[env_var]:
        return _runtime_api_keys[env_var]
    return os.environ.get(env_var, "")


def set_api_key(env_var: str, api_key: str) -> None:
    _runtime_api_keys[env_var] = api_key
    os.environ[env_var] = api_key


def get_model_config(model_id: str) -> Optional[dict]:
    config = LLM_MODELS.get(model_id)
    if not config:
        return None
    api_key = _get_api_key(config["api_key_env"])
    return {
        **config,
        "api_key": api_key,
    }


def get_available_models() -> list[dict]:
    result = []
    for model_id, config in LLM_MODELS.items():
        api_key = _get_api_key(config["api_key_env"])
        result.append({
            "id": model_id,
            "name": config["name"],
            "provider": config["provider"],
            "available": bool(api_key),
            "api_key_env": config["api_key_env"],
        })
    return result
