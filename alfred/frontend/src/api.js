const API_BASE = '/api';

export async function fetchScenarios() {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error(`Failed to fetch scenarios: ${res.status}`);
  return res.json();
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`);
  return res.json();
}

export async function submitDecision(decisionInput) {
  const res = await fetch(`${API_BASE}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(decisionInput),
  });
  if (!res.ok) throw new Error(`Decision request failed: ${res.status}`);
  return res.json();
}

export async function runScenario(scenarioId, modelId = null) {
  let url = `${API_BASE}/decision/scenario/${scenarioId}`;
  if (modelId) url += `?model_id=${modelId}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`Scenario run failed: ${res.status}`);
  return res.json();
}

export async function configureApiKey(envVar, apiKey) {
  const res = await fetch(`${API_BASE}/models/api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ env_var: envVar, api_key: apiKey }),
  });
  if (!res.ok) throw new Error(`API key configuration failed: ${res.status}`);
  return res.json();
}
