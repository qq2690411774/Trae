import { useState } from 'react';

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'draft_email', label: 'Draft Email' },
  { value: 'create_calendar', label: 'Create Calendar Event' },
  { value: 'delete_calendar', label: 'Delete Calendar Event' },
  { value: 'set_reminder', label: 'Set Reminder' },
  { value: 'delete_reminder', label: 'Delete Reminder' },
  { value: 'schedule_meeting', label: 'Schedule Meeting' },
  { value: 'other', label: 'Other' },
];

export default function DecisionInput({ models, onSubmit, loading }) {
  const [action, setAction] = useState('');
  const [latestMessage, setLatestMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState('');
  const [actionType, setActionType] = useState('other');
  const [modelId, setModelId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      action,
      latest_message: latestMessage,
      conversation_history: conversationHistory
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      action_type: actionType,
      model_id: modelId || null,
      simulate_timeout: false,
      simulate_malformed: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#374151' }}>
        Custom Input
      </h3>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          Action Type
        </label>
        <select
          value={actionType}
          onChange={(e) => setActionType(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
        >
          {ACTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          Action *
        </label>
        <input
          required
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="e.g., Send email to client"
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          Latest Message *
        </label>
        <input
          required
          value={latestMessage}
          onChange={(e) => setLatestMessage(e.target.value)}
          placeholder="e.g., Send it"
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          Conversation History (one per line)
        </label>
        <textarea
          value={conversationHistory}
          onChange={(e) => setConversationHistory(e.target.value)}
          placeholder={"User: Draft a reply to Acme\nalfred_: I've drafted the email\nUser: Hold off until legal reviews"}
          rows={3}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
          LLM Model
        </label>
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
        >
          <option value="">Default</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.provider}) {!m.available ? '⚠️ No API Key' : '✓'}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !action || !latestMessage}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: loading ? '#9ca3af' : '#3b82f6',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '4px',
        }}
      >
        {loading ? 'Processing...' : 'Submit Decision'}
      </button>
    </form>
  );
}
