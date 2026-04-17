import { useState } from 'react';
import { configureApiKey } from '../api';

const API_KEY_ENV_VARS = [
  { env_var: 'OPENAI_API_KEY', label: 'OpenAI (GPT-4o-mini)', placeholder: 'sk-...' },
  { env_var: 'ZHIPU_API_KEY', label: 'ZhipuAI (GLM-5.1 / GLM-5V-Turbo)', placeholder: '...' },
  { env_var: 'MINIMAX_API_KEY', label: 'MiniMax (MiniMax-M2.5)', placeholder: '...' },
  { env_var: 'DOUBAO_API_KEY', label: 'ByteDance (Doubao-Seed-Code)', placeholder: '...' },
  { env_var: 'MOONSHOT_API_KEY', label: 'Moonshot (Kimi-K2.5)', placeholder: '...' },
  { env_var: 'DASHSCOPE_API_KEY', label: 'Alibaba (Qwen3.6-Plus)', placeholder: '...' },
];

export default function ApiKeyConfig({ models, onKeysUpdated }) {
  const [selectedEnv, setSelectedEnv] = useState('OPENAI_API_KEY');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  const configuredKeys = new Set(
    models.filter((m) => m.available).map((m) => m.api_key_env)
  );

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await configureApiKey(selectedEnv, apiKey.trim());
      setMessage({ type: 'success', text: 'API Key saved successfully!' });
      setApiKey('');
      if (onKeysUpdated) onKeysUpdated();
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
      <div
        onClick={() => setShowPanel(!showPanel)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
        }}
      >
        <span>🔑 API Key Configuration</span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{showPanel ? '▼' : '▶'}</span>
      </div>

      {showPanel && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
            Configure API keys to enable LLM-powered decisions. Keys are stored in memory (not persisted to disk).
            You can also set keys via the <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px', fontSize: '11px' }}>backend/.env</code> file.
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {API_KEY_ENV_VARS.map((k) => (
              <span
                key={k.env_var}
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: configuredKeys.has(k.env_var) ? '#dcfce7' : '#fee2e2',
                  color: configuredKeys.has(k.env_var) ? '#166534' : '#991b1b',
                }}
              >
                {configuredKeys.has(k.env_var) ? '✓' : '✗'} {k.label.split(' ')[0]}
              </span>
            ))}
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
              Provider
            </label>
            <select
              value={selectedEnv}
              onChange={(e) => { setSelectedEnv(e.target.value); setMessage(null); }}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
            >
              {API_KEY_ENV_VARS.map((k) => (
                <option key={k.env_var} value={k.env_var}>
                  {k.label} {configuredKeys.has(k.env_var) ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={API_KEY_ENV_VARS.find((k) => k.env_var === selectedEnv)?.placeholder || 'Enter API key'}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: saving ? '#9ca3af' : '#10b981',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save API Key'}
          </button>

          {message && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#166534' : '#dc2626',
            }}>
              {message.type === 'success' ? '✓' : '⚠️'} {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
