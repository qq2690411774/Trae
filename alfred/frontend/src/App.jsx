import { useState, useEffect, useCallback, useRef } from 'react';
import ScenarioList from './components/ScenarioList';
import DecisionInput from './components/DecisionInput';
import DecisionResult from './components/DecisionResult';
import PipelineView from './components/PipelineView';
import ApiKeyConfig from './components/ApiKeyConfig';
import { fetchScenarios, fetchModels, submitDecision, runScenario } from './api';

const DEFAULT_MODEL_ID = 'glm-5.1';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const selectedModelIdRef = useRef(DEFAULT_MODEL_ID);

  const loadModels = useCallback(() => {
    fetchModels()
      .then(setModels)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    fetchScenarios()
      .then(setScenarios)
      .catch((e) => setError(e.message));
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    selectedModelIdRef.current = selectedModelId;
  }, [selectedModelId]);

  const handleScenarioSelect = async (scenario) => {
    setSelectedScenarioId(scenario.id);
    setLoading(true);
    setError(null);
    setResult(null);
    setShowPipeline(false);
    try {
      const modelId = selectedModelIdRef.current;
      const res = await runScenario(scenario.id, modelId);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (input) => {
    setSelectedScenarioId(null);
    setLoading(true);
    setError(null);
    setResult(null);
    setShowPipeline(false);
    try {
      const res = await submitDecision(input);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const availableCount = models.filter((m) => m.available).length;

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header
        style={{
          background: '#111827',
          color: '#fff',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          alfred_
        </span>
        <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 400 }}>
          Execution Decision Layer
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {availableCount}/{models.length} models available
          </div>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#e5e7eb',
              fontSize: '12px',
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider}{m.id === DEFAULT_MODEL_ID ? ', Default' : ''})
              </option>
            ))}
          </select>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ScenarioList
              scenarios={scenarios}
              selectedId={selectedScenarioId}
              onSelect={handleScenarioSelect}
            />
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <DecisionInput models={models} onSubmit={handleCustomSubmit} loading={loading} />
            </div>
            <ApiKeyConfig models={models} onKeysUpdated={loadModels} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                <div>Analyzing decision pipeline...</div>
              </div>
            )}

            {error && (
              <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
                ⚠️ Error: {error}
              </div>
            )}

            {result && (
              <>
                <DecisionResult result={result} />
                <button
                  onClick={() => setShowPipeline(!showPipeline)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  {showPipeline ? 'Hide Pipeline ▲' : 'Show Pipeline ▼'}
                </button>
                {showPipeline && <PipelineView trace={result.pipeline_trace} />}
              </>
            )}

            {!loading && !error && !result && (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                  Select a scenario or submit a custom input
                </div>
                <div style={{ fontSize: '13px' }}>
                  The decision engine will analyze the action and context to determine the appropriate execution strategy.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}