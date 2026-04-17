import urllib.request
import json

try:
    req = urllib.request.Request("http://127.0.0.1:8088/api/health")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print("Health:", data)
except Exception as e:
    print(f"Health Error: {e}")

try:
    req = urllib.request.Request("http://127.0.0.1:8088/api/scenarios")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print(f"Scenarios: {len(data)} found")
except Exception as e:
    print(f"Scenarios Error: {e}")

try:
    req = urllib.request.Request("http://127.0.0.1:8088/api/models")
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print(f"Models: {len(data)} found")
        for m in data:
            print(f"  {m['name']} ({m['provider']}) - available: {m['available']}")
except Exception as e:
    print(f"Models Error: {e}")
