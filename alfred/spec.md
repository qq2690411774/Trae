# alfred_ Execution Decision Layer — Technical Specification

## 1. Project Overview

alfred_ is an AI assistant that lives in text messages, helping users manage email, calendar, reminders, and scheduling. The core objective of this project is to **design and implement an Execution Decision Layer** that determines which action strategy alfred_ should take when facing user requests.

### Five Decision Types

| Decision | Description |
|----------|-------------|
| **Execute silently** | Execute without notifying the user |
| **Execute and tell after** | Execute and notify the user after |
| **Confirm before executing** | Ask for user confirmation before executing |
| **Ask a clarifying question** | Intent/parameters unclear, need to ask |
| **Refuse / escalate** | Refuse execution or escalate handling |

### Project Status: ✅ Completed and Deployed

- **Frontend URL**: https://trae-frontend.up.railway.app/
- **Backend URL**: https://trae-backend.up.railway.app/
- **GitHub**: https://github.com/qq2690411774/Trae
- **Local Run**: Frontend `http://localhost:5173/` | Backend `http://localhost:8088`

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  ┌───────────┐ ┌────────────┐ ┌───────────────────┐ │
│  │ Scenario   │ │ Decision    │ │ API Key Config     │ │
│  │ List       │ │ Input Panel │ │ Panel              │ │
│  └───────────┘ └────────────┘ └───────────────────┘ │
│  ┌──────────────┐  ┌─────────────────────────────┐   │
│  │ Decision      │  │ Pipeline View (Pipeline Trace)│   │
│  │ Result Card   │  │                             │   │
│  └──────────────┘  └─────────────────────────────┘   │
└────────────────────────┬────────────────────────────┘
                         │ HTTP API (VITE_API_BASE)
┌────────────────────────▼────────────────────────────┐
│                 Backend (FastAPI)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Decision Pipeline                    │   │
│  │                                               │   │
│  │  1. Input Parser ─── Input parsing & standardization │
│  │  2. Signal Engine ── Deterministic signal computation  │
│  │  3. Prompt Builder ─ Context-aware prompt construction │
│  │  4. LLM Caller ──── LLM inference call          │   │
│  │  5. Output Parser ── Structured output parsing  │   │
│  │  6. Decision Finalizer ─ Final decision & safety fallback │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Scenario Store│  │ Model Config │                │
│  │ (8 scenarios) │  │ (Multi-model)│               │
│  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────┘
```

---

## 3. Core Design: Decision Pipeline

### 3.1 Input Model

```python
class DecisionInput:
    action: str                    # Proposed action description
    latest_message: str            # User's latest message
    conversation_history: list[str] # Conversation history
    user_state: dict               # User state (preferences, trust level, etc.)
    action_type: ActionType        # Action type enum
    model_id: Optional[str]        # LLM model ID to use (optional)
    simulate_timeout: bool         # Simulate LLM timeout (for testing)
    simulate_malformed: bool       # Simulate malformed output (for testing)
```

**Supported Action Type Enums**:
- `SEND_EMAIL` - Send email
- `DRAFT_EMAIL` - Draft email
- `CREATE_CALENDAR` - Create calendar event
- `DELETE_CALENDAR` - Delete calendar event
- `SET_REMINDER` - Set reminder
- `DELETE_REMINDER` - Delete reminder
- `SCHEDULE_MEETING` - Schedule meeting
- `OTHER` - Other type

### 3.2 Deterministic Signal Engine

The following signals are **deterministically computed by code**, without relying on the LLM:

| Signal | Computation Method | Purpose |
|--------|-------------------|---------|
| `action_risk_level` | Risk mapping table based on action type (LOW/MEDIUM/HIGH) | Determine inherent risk of action |
| `has_conversation_history` | History message count > 0 | Determine if context exists |
| `user_trust_level` | Trust level from user state (low/medium/high) | Affect silent execution threshold |
| `is_irreversible` | Whether action type is irreversible (e.g., sending email, deleting calendar) | Trigger confirmation mechanism |
| `involves_external_party` | Whether external parties are involved | Elevate risk level |
| `has_explicit_confirmation` | Whether latest message contains confirmation words (bilingual support) | Determine user intent |
| `history_message_count` | Number of conversation history messages | Evaluate context richness |
| `has_contradictory_signals` | Both hold and confirm signals exist in history | Detect conflicting instructions |

**Action Risk Mapping Table (Implemented):**

| Action Type | Inherent Risk | Irreversible | Involves External |
|-------------|---------------|--------------|-------------------|
| SEND_EMAIL | HIGH | ✅ | ✅ |
| DRAFT_EMAIL | LOW | ❌ | ❌ |
| CREATE_CALENDAR | LOW | ❌ | ✅ |
| DELETE_CALENDAR | MEDIUM | ✅ | ✅ |
| SET_REMINDER | LOW | ❌ | ❌ |
| DELETE_REMINDER | LOW | ❌ | ❌ |
| SCHEDULE_MEETING | MEDIUM | ❌ | ✅ |
| OTHER | MEDIUM | ❌ | ❌ |

**Confirmation Word Detection (Bilingual Support):**
- English: "yes", "yep", "yeah", "sure", "ok", "okay", "send it", "go ahead", "do it", "confirm", "approved", "proceed", "go for it"
- Chinese: "发吧", "确认", "发送吧", "好的", "可以", "没问题", "执行吧", "同意", "就这样"

**Hold Word Detection (for identifying pause instructions):**
- English: "wait", "hold", "hold off", "stop", "cancel", "not yet", "don't"
- Chinese: "等一下", "等等", "先别", "暂停", "取消", "不要"

### 3.3 LLM vs Code Responsibility Division

**LLM Responsibilities (requires semantic understanding):**
- Analyze intent evolution in conversation history
- Determine if intent is fully resolved
- Identify if key parameters are missing
- Evaluate risk signals in context
- Generate structured JSON decision output (decision, confidence, intent_resolved, key_parameters, risk_assessment, rationale)

**Code Responsibilities (deterministic logic):**
- Action risk level mapping
- Irreversible action detection
- Confirmation word / Hold word detection (bilingual)
- Conversation history contradiction signal detection
- Safety fallback rule engine (default behavior when LLM times out/errors)
- Final decision rule override and correction
- High-risk action forced rejection (batch deletion, sensitive data leakage to competitors, etc.)

### 3.4 Prompt Design

Uses structured prompt with the following parts:

```
System: You are alfred_'s Execution Decision Engine. Given a proposed action and context, decide which execution strategy to take.

## Available Decisions
1. EXECUTE_SILENTLY - Execute without notifying the user
2. EXECUTE_AND_TELL - Execute and notify the user after
3. CONFIRM_FIRST - Ask for user confirmation before executing
4. ASK_CLARIFYING - Ask a clarifying question (intent, entity, or key parameters unresolved)
5. REFUSE_ESCALATE - Refuse the action or escalate to human

## Decision Boundaries
- ASK_CLARIFYING when intent, entity, or key parameters are unresolved.
- CONFIRM_FIRST when intent is resolved but risk is above the silent execution threshold.
- REFUSE_ESCALATE when policy disallows the action, or risk/uncertainty remains too high even after clarification.

## Deterministic Signals (pre-computed by code)
{signals_json}  // JSON object containing all 8 signals

## Output Format (strict JSON, no markdown, no extra text)
{
  "decision": "<Decision Type>",
  "confidence": <0-1>,
  "intent_resolved": <bool>,
  "key_parameters": {<param_name>: <resolved bool>},
  "risk_assessment": "<LOW/MEDIUM/HIGH>",
  "rationale": "<concise reason>"
}

User:
Action: {action}
Latest message: {latest_message}
Conversation history:
  [1] {msg1}
  [2] {msg2}
  ...
```

### 3.5 Safety Fallback Rules (Decision Finalizer)

When LLM is unavailable or output is abnormal, follow these **layered deterministic rules**:

**Layer 1: High-Risk Action Forced Rejection**
```python
IF batch deletion keywords in action_text ("delete all", "remove all", "clear all" etc.)
   OR (competitor keywords AND sensitive info keywords) in action_text:
   → REFUSE_ESCALATE
```

**Layer 2: Tiered Handling When LLM Unavailable**
```python
IF critical context missing (action or latest_message is empty):
   → ASK_CLARIFYING

ELIF high risk AND no explicit confirmation:
   → ASK_CLARIFYING

ELIF low risk AND irreversible AND has confirmation:
   → EXECUTE_AND_TELL

ELIF low risk AND reversible AND has confirmation:
   → EXECUTE_AND_TELL

ELIF low risk AND reversible AND no confirmation:
   → EXECUTE_SILENTLY

ELSE:
   → CONFIRM_FIRST  # Default safety strategy: better to ask than to mistakenly execute
```

**Layer 3: Rule Override in Normal Cases**
```python
IF intent unresolved AND decision is EXECUTE_SILENTLY:
   → ASK_CLARIFYING  # Correct to ask for clarification

IF irreversible AND involves external AND decision is EXECUTE_SILENTLY:
   → CONFIRM_FIRST  # Force requirement for confirmation

IF irreversible AND no confirmation word AND decision is EXECUTE_SILENTLY:
   → CONFIRM_FIRST  # Force requirement for confirmation

IF contradictory signals exist AND decision is silent-type:
   → CONFIRM_FIRST  # Require confirmation to eliminate ambiguity
```

---

## 4. Frontend Design

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────┐
│  alfred_ Execution Decision Layer     [Model ▼] │
├─────────────────────┬───────────────────────────┤
│                     │                           │
│   Preloaded Scenarios│    ⚠️ Error: Failed to...│
│   ┌───────────────┐ │  (or decision result)      │
│   │ 1. Set reminder│ │                           │
│   │ 2. Team meeting│ │  ┌─────────────────────┐  │
│   │ 3. Send email  │ │  │ Decision Result Card │  │
│   │ 4. Hold signal │ │  │ ✅ CONFIRM_FIRST     │  │
│   │ 5. Delete cal  │ │  │ Confidence: 0.85     │  │
│   │ 6. Send contract│ │  │ Rationale: ...       │  │
│   │ 7. LLM Timeout │ │  └─────────────────────┘  │
│   │ 8. Malformed   │ │                           │
│   └───────────────┘ │  [Show Pipeline ▼]         │
│                     │                           │
│   Custom Input       │  Pipeline View (if shown): │
│   ┌───────────────┐ │  1. Inputs                │
│   │ Action Type ▼ │ │  2. Signals               │
│   │ Action *      │ │  3. Prompt                │
│   │ Message *     │ │  4. Raw LLM Output        │
│   │ History *     │ │  5. Final Decision        │
│   │ LLM Model ▼  │ │                           │
│   │[Submit]       │ │                           │
│   └───────────────┘ │                           │
│                     │                           │
│ 🔑 API Key Config  │                           │
│ [▶ Click to expand]│                           │
└─────────────────────┴───────────────────────────┘
```

### 4.2 Core Components

| Component | File | Functionality |
|-----------|------|---------------|
| App.jsx | src/App.jsx | Main app, state management, layout orchestration |
| ScenarioList | components/ScenarioList.jsx | Preloaded scenario list display and selection |
| DecisionInput | components/DecisionInput.jsx | Custom input form (Action Type, Action, Message, History, Model) |
| DecisionResult | components/DecisionResult.jsx | Decision result card (decision type, confidence, rationale, risk assessment) |
| PipelineView | components/PipelineView.jsx | Full pipeline display (5 expandable steps) |
| ApiKeyConfig | components/ApiKeyConfig.jsx | API Key runtime configuration panel |
| api.js | src/api.js | API call wrapper (fetchScenarios, fetchModels, submitDecision, runScenario, configureApiKey) |

### 4.3 Core Interaction Flow

1. **Page Load**: Automatically fetch scenarios and models list
2. **Scenario Selection**: Click preloaded scenario, auto-fill input with selected model and execute decision
3. **Custom Submission**: Manually fill Action Type, Action, Message, History, select model, click Submit
4. **Pipeline Expansion**: Click "Show Pipeline ▼" to view full pipeline 5 steps
5. **API Key Configuration**: Expand bottom panel, configure ZhipuAI or OpenAI API Key
6. **Failure Demonstration**: Scenario 7 (LLM Timeout) and Scenario 8 (Malformed Output) showcase fallback behavior

---

## 5. Technology Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| Backend Framework | FastAPI | >=0.104.0 | Lightweight, async, auto-generates API docs |
| ASGI Server | Uvicorn | >=0.24.0 | High-performance async server |
| Frontend Framework | React + Vite | Vite 8.0.8 | Rapid development, HMR hot reload |
| LLM SDK | OpenAI Python | >=1.0.0 | Unified interface compatible with multiple model providers |
| Data Validation | Pydantic | >=2.0.0 | Type-safe data models |
| Environment Management | python-dotenv | >=1.0.0 | .env file support |
| Deployment Platform | Railway | - | Auto-deployment, CI/CD support |

### 5.1 Supported LLM Models

| Model ID | Name | Provider | Base URL | API Key Env Variable | Default |
|----------|------|----------|----------|---------------------|---------|
| glm-5.1 | GLM-5.1 | ZhipuAI | https://open.bigmodel.cn/api/paas/v4 | ZHIPU_API_KEY | ✅ |
| glm-5v-turbo | GLM-5V-Turbo | ZhipuAI | https://open.bigmodel.cn/api/paas/v4 | ZHIPU_API_KEY | |
| gpt-4o-mini | GPT-4o-mini | OpenAI | https://api.openai.com/v1 | OPENAI_API_KEY | |

**Model Switching Mechanism:**
- All models called through unified OpenAI-compatible interface
- Frontend provides model selection dropdown for real-time switching
- PipelineTrace records actual model usage information
- API Keys configurable via frontend UI (stored in memory)

### 5.2 CORS Configuration

```python
CORS_ORIGINS = [
    "http://localhost:5173",      # Local development
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "https://trae-frontend.up.railway.app",  # Production environment
]
```

---

## 6. Preloaded Scenarios (8 Scenarios)

### Scenario Category Statistics

| Category | Count | Scenario IDs |
|----------|-------|--------------|
| Easy | 2 | 1, 2 |
| Ambiguous | 2 | 3, 4 |
| Risky | 2 | 5, 6 |
| Failure Simulation | 2 | 7, 8 |

### Detailed Scenario List

#### Scenario 1 (Easy - Silent Execution)
- **Title**: Set a reminder to drink water
- **Action**: Set reminder: drink water at 3pm
- **Latest Message**: Remind me to drink water at 3pm
- **Action Type**: SET_REMINDER
- **Expected Decision**: EXECUTE_SILENTLY
- **Expected Rationale**: Low risk, reversible, clear intent with all parameters resolved.

#### Scenario 2 (Easy - Execute and Tell)
- **Title**: Schedule a team meeting
- **Action**: Create calendar event: team meeting Friday 2pm
- **Latest Message**: Schedule a team meeting on Friday at 2pm
- **Action Type**: SCHEDULE_MEETING
- **Expected Decision**: EXECUTE_AND_TELL
- **Expected Rationale**: Low risk, clear intent, involves others but manageable. Execute and notify.

#### Scenario 3 (Ambiguous - Ask Clarifying)
- **Title**: Send an email (missing details)
- **Action**: Send email
- **Latest Message**: Send an email for me
- **Action Type**: SEND_EMAIL
- **Expected Decision**: ASK_CLARIFYING
- **Expected Rationale**: Missing recipient, subject, and content. Key parameters unresolved.

#### Scenario 4 (Ambiguous - Context Conflict Requires Confirmation)
- **Title**: Send email after hold signal
- **Action**: Send email reply to external partner (Acme Corp)
- **Latest Message**: Yep, send it
- **Conversation History**:
  ```
  User: Draft a reply to Acme proposing a 20% discount
  alfred_: I've drafted the email. Shall I send it?
  User: Actually hold off until legal reviews pricing language
  User: Yep, send it
  ```
- **Action Type**: SEND_EMAIL
- **Expected Decision**: CONFIRM_FIRST
- **Expected Rationale**: Contradictory signals: user previously said to hold off for legal review. Current status of legal review is unclear. Must confirm before sending.

#### Scenario 5 (Risky - Refuse Execution)
- **Title**: Delete all calendar events
- **Action**: Delete all calendar events
- **Latest Message**: Delete all my calendar events
- **Action Type**: DELETE_CALENDAR
- **Expected Decision**: REFUSE_ESCALATE
- **Expected Rationale**: Batch deletion of all calendar events is extremely high risk and irreversible. Refusing and escalating to human review.

#### Scenario 6 (Risky - Refuse Sensitive Data Leakage)
- **Title**: Send contract to competitor
- **Action**: Send email with contract terms to competitor company
- **Latest Message**: Send the contract terms to our competitor
- **Action Type**: SEND_EMAIL
- **Expected Decision**: REFUSE_ESCALATE
- **Expected Rationale**: Sending contract terms to a competitor poses severe confidentiality and legal risks. Refusing and escalating.

#### Scenario 7 (Failure - LLM Timeout Simulation)
- **Title**: LLM Timeout Simulation
- **Action**: Delete calendar event: old team sync
- **Latest Message**: Delete the old team sync from my calendar
- **Action Type**: DELETE_CALENDAR
- **Special Setting**: simulate_timeout=True
- **Expected Decision**: CONFIRM_FIRST
- **Expected Rationale**: LLM timeout fallback: irreversible action involving external party, defaulting to CONFIRM_FIRST for safety.
- **UI Display**: ⚠️ Timeout warning + fallback decision explanation

#### Scenario 8 (Failure - Malformed Output Simulation)
- **Title**: Malformed Output Simulation
- **Action**: Set reminder for team lunch
- **Latest Message**: Remind me about the team lunch tomorrow
- **Action Type**: SET_REMINDER
- **Special Setting**: simulate_malformed=True
- **Expected Decision**: CONFIRM_FIRST
- **Expected Rationale**: Malformed LLM output fallback: defaulting to CONFIRM_FIRST for safety.
- **UI Display**: ⚠️ Output parse failure + raw output display

---

## 7. Failure Handling Design

| Failure Type | Trigger Method | Handling Strategy | UI Display |
|-------------|----------------|-------------------|------------|
| LLM Timeout | simulate_timeout=True or actual timeout (>30s) | Trigger deterministic fallback rule engine, tiered handling based on signals | Show ⚠️ timeout warning + fallback_used=true + fallback decision explanation |
| Malformed Model Output | simulate_malformed=True or non-JSON output | Attempt JSON extraction and repair; fall back to rules on failure | Show ⚠️ output parse failure + raw_llm_output |
| Model Not Configured | No API Key set | Return MODEL_NOT_CONFIGURED error | Frontend shows models available = 0 |
| Missing Critical Context | action/latest_message is empty | Directly ASK_CLARIFYING | Show ⚠️ insufficient context warning |

---

## 8. API Endpoints

| Method | Endpoint | Function | Request Body | Response |
|--------|----------|----------|--------------|----------|
| POST | /api/decision | Submit custom decision request | DecisionInput | DecisionOutput + PipelineTrace |
| GET | /api/scenarios | Get preloaded scenario list | - | list[Scenario] (8 items) |
| POST | /api/decision/scenario/{id} | Execute specified preloaded scenario | query: model_id? | DecisionOutput + PipelineTrace |
| GET | /api/models | Get available model list | - | list[ModelInfo] |
| POST | /api/models/api-key | Configure API Key | {env_var, api_key} | {status, configured, models_updated} |
| GET | /health | Health check | - | {"status": "ok"} |
| GET | /api/debug | Debug information | - | Service config, routes, file listing |

---

## 9. Project Directory Structure

```
alfred/
├── backend/
│   ├── main.py                  # FastAPI entry point, static file serving, CORS config
│   ├── models.py                # Pydantic data models (12 model classes)
│   ├── config.py                # Configuration (LLM models, CORS, API Key management)
│   ├── routes.py                # API route definitions (7 endpoints)
│   ├── scenarios.py             # 8 preloaded scenario definitions
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── input_parser.py      # Input parsing & standardization
│   │   ├── signal_engine.py     # Deterministic signal computation (8 signals)
│   │   ├── prompt_builder.py    # Structured prompt construction
│   │   ├── llm_caller.py        # LLM invocation (multi-model, timeout, retry, simulation)
│   │   ├── output_parser.py     # Structured output parsing (JSON extraction, repair, degradation)
│   │   └── decision_finalizer.py # Decision finalization & safety fallback (multi-layer rule engine)
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variable example
│   └── Procfile                 # Railway deployment configuration
├── frontend/
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Main application component
│   │   ├── api.js               # API call wrapper
│   │   ├── index.css            # Global styles
│   │   └── components/
│   │       ├── ScenarioList.jsx     # Scenario list component
│   │       ├── DecisionInput.jsx    # Custom input component
│   │       ├── DecisionResult.jsx   # Decision result component
│   │       ├── PipelineView.jsx     # Pipeline view component
│   │       └── ApiKeyConfig.jsx     # API Key configuration component
│   ├── public/                   # Static assets
│   ├── .env.production           # Production environment API URL
│   ├── vite.config.js            # Vite configuration (proxy, port)
│   ├── package.json              # Node dependencies
│   └── index.html                # HTML entry point
├── Procfile                      # Root Procfile
├── requirement.md                # Original requirements document
├── spec.md                       # This document - Technical specification
├── tasks.md                      # Task checklist
├── checklist.md                  # Test checklist
└── README.md                     # Project documentation
```

---

## 10. Design Highlights & Trade-offs

### 10.1 Signal System Design Philosophy

Adopts **hybrid architecture**: deterministic signals (code) + semantic understanding (LLM), each playing to their strengths:
- **Code excels at**: Rule matching, pattern recognition, edge case handling
- **LLM excels at**: Context understanding, intent inference, natural language reasoning
- **Safety first**: Any uncertainty tends toward more conservative decisions

### 10.2 Value of Multi-Model Support

- **Flexibility**: Choose different models based on cost, latency, and capability
- **Fault tolerance**: Quick switch when single model fails
- **Experimentation**: Convenient comparison of decision quality across models
- **Runtime configuration**: Switch models and update API keys without restarting service

### 10.3 Transparency of Failure Modes

- **PipelineTrace completely records** input/output of every step
- **fallback_used flag** clearly identifies whether fallback logic was used
- **error field** records original error information
- **Frontend visualization** displays warning icons and detailed explanations
