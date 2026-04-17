import os
from typing import Optional

LLM_MODELS = {
    "gpt-4o-mini": {
        "name": "GPT-4o-mini",
        "provider": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "model_name": "gpt-4o-mini",
    },
    "minimax-m2.5": {
        "name": "MiniMax-M2.5",
        "provider": "MiniMax",
        "base_url": "https://api.minimax.chat/v1",
        "api_key_env": "MINIMAX_API_KEY",
        "model_name": "MiniMax-M2.5",
    },
    "doubao-seed-code": {
        "name": "Doubao-Seed-Code",
        "provider": "ByteDance",
        "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        "api_key_env": "DOUBAO_API_KEY",
        "model_name": "doubao-seed-code",
    },
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
    "kimi-k2.5": {
        "name": "Kimi-K2.5",
        "provider": "Moonshot",
        "base_url": "https://api.moonshot.cn/v1",
        "api_key_env": "MOONSHOT_API_KEY",
        "model_name": "kimi-k2.5",
    },
    "qwen3.6-plus": {
        "name": "Qwen3.6-Plus",
        "provider": "Alibaba",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key_env": "DASHSCOPE_API_KEY",
        "model_name": "qwen3.6-plus",
    },
}

DEFAULT_MODEL = "gpt-4o-mini"

LLM_TIMEOUT = 10
LLM_MAX_RETRIES = 1

CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]


def get_model_config(model_id: str) -> Optional[dict]:
    config = LLM_MODELS.get(model_id)
    if not config:
        return None
    api_key = os.environ.get(config["api_key_env"], "")
    return {
        **config,
        "api_key": api_key,
    }


def get_available_models() -> list[dict]:
    result = []
    for model_id, config in LLM_MODELS.items():
        api_key = os.environ.get(config["api_key_env"], "")
        result.append({
            "id": model_id,
            "name": config["name"],
            "provider": config["provider"],
            "available": bool(api_key),
        })
    return result
