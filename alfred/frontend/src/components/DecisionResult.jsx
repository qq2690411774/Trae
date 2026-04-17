const DECISION_CONFIG = {
  EXECUTE_SILENTLY: { label: 'Execute Silently', icon: '✅', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  EXECUTE_AND_TELL: { label: 'Execute & Tell', icon: '📢', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  CONFIRM_FIRST: { label: 'Confirm First', icon: '⚠️', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  ASK_CLARIFYING: { label: 'Ask Clarifying', icon: '❓', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  REFUSE_ESCALATE: { label: 'Refuse / Escalate', icon: '🚫', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

export default function DecisionResult({ result }) {
  if (!result) return null;

  const config = DECISION_CONFIG[result.decision] || DECISION_CONFIG.CONFIRM_FIRST;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          padding: '16px',
          borderRadius: '12px',
          background: config.bg,
          border: `2px solid ${config.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>{config.icon}</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: config.color }}>
            {config.label}
          </span>
          {result.fallback_used && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#f59e0b',
                color: '#fff',
              }}
            >
              FALLBACK
            </span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>
          {result.rationale}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Confidence</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
            {(result.confidence * 100).toFixed(0)}%
          </div>
        </div>
        <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Risk Level</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
            {result.risk_assessment}
          </div>
        </div>
        <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Intent Resolved</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: result.intent_resolved ? '#22c55e' : '#ef4444' }}>
            {result.intent_resolved ? 'Yes' : 'No'}
          </div>
        </div>
        <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>Model Used</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
            {result.model_used || 'N/A'}
          </div>
        </div>
      </div>

      {Object.keys(result.key_parameters || {}).length > 0 && (
        <div style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, marginBottom: '4px' }}>Key Parameters</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {Object.entries(result.key_parameters).map(([k, v]) => (
              <span
                key={k}
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: v ? '#dcfce7' : '#fee2e2',
                  color: v ? '#166534' : '#991b1b',
                }}
              >
                {k}: {v ? '✓' : '✗'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
