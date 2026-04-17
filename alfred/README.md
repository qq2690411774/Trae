# alfred_ Execution Decision Layer

A decision engine that determines how alfred_ (an AI assistant living in text messages) should handle user requests — whether to act silently, confirm first, ask for clarification, or refuse.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Set up LLM API Keys

At least one LLM provider API key is required. Set environment variables:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# ZhipuAI (GLM models)
export ZHIPU_API_KEY="..."

# MiniMax
export MINIMAX_API_KEY="..."

# ByteDance (Doubao)
export DOUBAO_API_KEY="..."

# Moonshot (Kimi)
export MOONSHOT_API_KEY="..."

# Alibaba (Qwen)
export DASHSCOPE_API_KEY="..."
```

### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8088
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## System Design

### Decision Pipeline

The system uses a 6-step pipeline to make execution decisions:

```
Input Parser → Signal Engine → Prompt Builder → LLM Caller → Output Parser → Decision Finalizer
```

### Five Decision Types

| Decision | When |
|----------|------|
| **EXECUTE_SILENTLY** | Low risk, clear intent, reversible |
| **EXECUTE_AND_TELL** | Low-medium risk, clear intent, involves others |
| **CONFIRM_FIRST** | Intent resolved but risk above threshold |
| **ASK_CLARIFYING** | Intent, entity, or key parameters unresolved |
| **REFUSE_ESCALATE** | Policy disallows, or risk too high even after clarification |

### Signals the System Uses

| Signal | Type | Why |
|--------|------|-----|
| `action_risk_level` | Deterministic | Maps action types to inherent risk levels |
| `is_irreversible` | Deterministic | Actions like sending email cannot be undone |
| `involves_external_party` | Deterministic | External parties increase risk |
| `has_explicit_confirmation` | Deterministic | Detects confirmation words in latest message |
| `has_contradictory_signals` | Deterministic | Detects hold+confirm conflicts in history |
| `user_trust_level` | Deterministic | From user state, affects thresholds |
| Intent resolution | LLM | Requires semantic understanding of conversation |
| Key parameter completeness | LLM | Requires understanding what parameters matter |
| Contextual risk assessment | LLM | Requires understanding nuance in conversation |

### LLM vs Code Responsibility Split

**LLM handles (semantic reasoning):**
- Analyzing intent evolution across conversation history
- Determining if intent is fully resolved
- Identifying missing key parameters
- Assessing contextual risk signals
- Generating decision rationale

**Code handles (deterministic logic):**
- Action risk level mapping (lookup table)
- Irreversibility detection (lookup table)
- Confirmation word detection (keyword matching)
- Contradictory signal detection (hold + confirm in history)
- Safety fallback rules (when LLM is unavailable)
- Final decision override (e.g., irreversible + external → always confirm)

### Prompt Design

The prompt follows a structured format:
1. **System prompt**: Defines the decision engine role, available decisions, and decision boundaries
2. **Deterministic signals**: Pre-computed signals injected as JSON context
3. **User prompt**: Action, latest message, and conversation history
4. **Output format**: Strict JSON schema with decision, confidence, intent_resolved, key_parameters, risk_assessment, and rationale

### Supported LLM Models

| Model | Provider | API Compatibility |
|-------|----------|-------------------|
| GPT-4o-mini | OpenAI | OpenAI SDK |
| MiniMax-M2.5 | MiniMax | OpenAI Compatible |
| Doubao-Seed-Code | ByteDance | OpenAI Compatible |
| GLM-5.1 | ZhipuAI | OpenAI Compatible |
| GLM-5V-Turbo | ZhipuAI | OpenAI Compatible |
| Kimi-K2.5 | Moonshot | OpenAI Compatible |
| Qwen3.6-Plus | Alibaba | OpenAI Compatible |

All models are accessed via the OpenAI-compatible API interface. Users can switch models from the UI dropdown.

### Safety Fallback Rules

When the LLM is unavailable (timeout, error, malformed output):

```
IF irreversible AND involves_external → CONFIRM_FIRST
IF irreversible AND no explicit confirmation → CONFIRM_FIRST
IF contradictory signals in history → CONFIRM_FIRST
IF critical context missing → ASK_CLARIFYING
DEFAULT → CONFIRM_FIRST  (safe default: ask rather than act)
```

### Expected Failure Modes

1. **LLM Timeout**: Falls back to deterministic rules with CONFIRM_FIRST as default
2. **Malformed Model Output**: Attempts JSON extraction and repair; falls back to keyword-based decision parsing
3. **Missing Critical Context**: Returns ASK_CLARIFYING
4. **Model Not Configured**: Falls back to deterministic rules (no API key set)

### Preloaded Scenarios

| # | Category | Scenario | Expected Decision |
|---|----------|----------|-------------------|
| 1 | Easy | Set reminder to drink water | EXECUTE_SILENTLY |
| 2 | Easy | Schedule team meeting | EXECUTE_AND_TELL |
| 3 | Ambiguous | Send email (missing details) | ASK_CLARIFYING |
| 4 | Ambiguous | Send email after hold signal | CONFIRM_FIRST |
| 5 | Risky | Delete all calendar events | REFUSE_ESCALATE |
| 6 | Risky | Send contract to competitor | REFUSE_ESCALATE |
| 7 | Failure | LLM timeout simulation | CONFIRM_FIRST (fallback) |
| 8 | Failure | Malformed output simulation | CONFIRM_FIRST (fallback) |

---

## How I Would Evolve This System

### As alfred_ gains riskier tools:

1. **Tiered action policies**: Instead of a single risk mapping, create per-tool policies with specific rules (e.g., financial transactions have amount thresholds, data access has sensitivity levels)
2. **User-specific trust calibration**: Learn from user behavior over time — users who frequently override confirmations get higher trust levels
3. **Multi-factor risk scoring**: Combine deterministic signals with LLM assessment into a weighted risk score
4. **Audit trail**: Log all decisions with full pipeline traces for post-hoc analysis
5. **Progressive autonomy**: Start conservative, gradually expand silent execution scope as confidence grows

### What I would build next (6-month roadmap):

1. **Month 1-2**: User trust calibration system + action policy engine with per-tool rules
2. **Month 2-3**: Multi-turn clarification flow (currently single-shot) + conversation state machine
3. **Month 3-4**: A/B testing framework for decision thresholds + metrics dashboard
4. **Month 4-5**: Fine-tuned decision model on alfred_ conversation data (replace prompt engineering)
5. **Month 5-6**: Human-in-the-loop feedback system + automated policy updates from edge cases

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/decision` | Submit a decision request |
| GET | `/api/scenarios` | List preloaded scenarios |
| POST | `/api/decision/scenario/{id}` | Run a preloaded scenario |
| GET | `/api/models` | List available LLM models |
| GET | `/api/health` | Health check |

### Decision Request Body

```json
{
  "action": "Send email to client",
  "latest_message": "Send it",
  "conversation_history": ["User: Draft a reply", "alfred_: Drafted. Send?"],
  "action_type": "send_email",
  "model_id": "gpt-4o-mini",
  "simulate_timeout": false,
  "simulate_malformed": false
}
```

---

## What I Chose Not to Build

- **User authentication**: Not needed for a prototype demo
- **Persistent storage**: Decisions are stateless; no database needed
- **Rate limiting**: Single-user prototype
- **Streaming LLM responses**: Decision output is small; streaming adds complexity without value
- **Advanced prompt chaining**: Single-prompt approach is sufficient for this scope; multi-turn clarification would be a natural next step
