const CATEGORY_CONFIG = {
  easy: { label: 'Easy', color: '#22c55e', bg: '#f0fdf4' },
  ambiguous: { label: 'Ambiguous', color: '#f59e0b', bg: '#fffbeb' },
  risky: { label: 'Risky', color: '#ef4444', bg: '#fef2f2' },
  failure: { label: 'Failure', color: '#8b5cf6', bg: '#f5f3ff' },
};

export default function ScenarioList({ scenarios, selectedId, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#374151' }}>
        Preloaded Scenarios
      </h3>
      {scenarios.map((s) => {
        const cat = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.easy;
        return (
          <div
            key={s.id}
            onClick={() => onSelect(s)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: selectedId === s.id ? `2px solid ${cat.color}` : '1px solid #e5e7eb',
              background: selectedId === s.id ? cat.bg : '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: cat.color,
                  color: '#fff',
                }}
              >
                {cat.label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>
                #{s.id}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
              {s.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}
