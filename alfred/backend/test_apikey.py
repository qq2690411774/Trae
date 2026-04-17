import urllib.request
import json

results = []

try:
    req = urllib.request.Request("http://127.0.0.1:8088/api/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        results.append(f"Health: {data}")
except Exception as e:
    results.append(f"Health Error: {e}")

try:
    req = urllib.request.Request("http://127.0.0.1:8088/api/models")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        results.append(f"\nModels ({len(data)}):")
        for m in data:
            results.append(f"  {m['name']} ({m['provider']}) - available: {m['available']} - env: {m.get('api_key_env', 'N/A')}")
except Exception as e:
    results.append(f"Models Error: {e}")

try:
    payload = json.dumps({"env_var": "OPENAI_API_KEY", "api_key": "test-key-123"}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8088/api/models/api-key",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        results.append(f"\nAPI Key Config: {data}")
except Exception as e:
    results.append(f"API Key Config Error: {e}")

try:
    req = urllib.request.Request("http://127.0.0.1:8088/api/models")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        results.append(f"\nModels after config ({len(data)}):")
        for m in data:
            results.append(f"  {m['name']} - available: {m['available']}")
except Exception as e:
    results.append(f"Models Error: {e}")

with open("apikey_test_results.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results))
