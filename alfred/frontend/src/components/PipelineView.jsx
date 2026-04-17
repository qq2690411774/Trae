import { useState } from 'react';

function PipelineStep({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '10px 14px',
          background: '#f9fafb',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 500,
          fontSize: '14px',
          color: '#374151',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function JsonBlock({ data }) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <pre
      style={{
        margin: 0,
        padding: '12px',
        background: '#1f2937',
        color: '#e5e7eb',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '1.5',
        overflow: 'auto',
        maxHeight: '300px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text}
    </pre>
  );
}

export default function PipelineView({ trace }) {
  if (!trace) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#374151' }}>
        Pipeline Trace
      </h3>

      <PipelineStep title="1. Inputs" defaultOpen={false}>
        <JsonBlock data={trace.inputs} />
      </PipelineStep>

      <PipelineStep title="2. Deterministic Signals" defaultOpen={false}>
        <JsonBlock data={trace.signals} />
      </PipelineStep>

      <PipelineStep title="3. Prompt Sent to Model" defaultOpen={false}>
        <div
          style={{
            padding: '12px',
            background: '#1f2937',
            borderRadius: '6px',
            fontSize: '12px',
            lineHeight: '1.5',
            color: '#e5e7eb',
            maxHeight: '400px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {trace.prompt}
        </div>
      </PipelineStep>

      <PipelineStep title="4. Raw LLM Output" defaultOpen={false}>
        {trace.error ? (
          <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '13px' }}>
            ⚠️ Error: {trace.error}
          </div>
        ) : (
          <JsonBlock data={trace.raw_llm_output || '(empty)'} />
        )}
      </PipelineStep>

      <PipelineStep title="5. Parsed LLM Output" defaultOpen={false}>
        {trace.parsed_llm_output ? (
          <JsonBlock data={trace.parsed_llm_output} />
        ) : (
          <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '13px' }}>
            ⚠️ No parsed output available
          </div>
        )}
      </PipelineStep>

      <PipelineStep title="6. Final Decision" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
              {trace.final_decision}
            </span>
            {trace.fallback_used && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#f59e0b', color: '#fff', fontWeight: 600 }}>
                FALLBACK USED
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#4b5563' }}>{trace.final_rationale}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Model: {trace.model_used}</div>
        </div>
      </PipelineStep>
    </div>
  );
}
