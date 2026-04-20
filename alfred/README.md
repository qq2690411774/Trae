# alfred_ Execution Decision Layer

> **A context-aware decision engine** that determines when an AI assistant should execute silently, confirm first, ask for clarification, or refuse — based on conversation history, user intent, and risk assessment.

[![Live Demo](https://img.shields.io/badge/🌐-Live%20Demo-blue?style=flat-square)](https://trae-frontend.up.railway.app/)
[![Backend API](https://img.shields.io/badge/🔧-Backend%20API-green?style=flat-square)](https://trae-backend.up.railway.app/docs)
[![GitHub Repo](https://img.shields.io/badge/📦-GitHub-black?style=flat-square&logo=github)](https://github.com/qq2690411774/Trae)

---

## Table of Contents

- [The Problem](#the-problem)
- [Quick Start](#quick-start)
- [Live Demo](#live-demo)
- [Architecture Overview](#architecture-overview)
- [Decision Pipeline](#decision-pipeline)
- [Signal System: What We Compute and Why](#signal-system-what-we-compute-and-why)
- [LLM vs Code: Responsibility Split](#llm-vs-code-responsibility-split)
- [Prompt Design](#prompt-design)
- [Safety & Failure Handling](#safety--failure-handling)
- [Preloaded Scenarios](#preloaded-scenarios)
- [API Reference](#api-reference)
- [Technology Stack](#technology-stack)
- [Evolution Roadmap](#evolution-roadmap)
- [What I Chose Not To Build](#what-i-chose-not-to-build)

---

## The Problem

At **alfred_**, we're building an AI assistant that lives in text messages and acts on behalf of users — managing email, calendar, reminders, and scheduling. One of our hardest product problems is deciding **when alfred_ should act silently, when it should confirm, when it should ask a clarifying question, and when it should refuse**.

This is not a simple classification task. It's a **contextual conversation decision problem** where the system must consider:
- The full conversation history (not just the latest message)
- User state and trust level
- Inherent risk of the proposed action
- Whether the action is reversible
- Whether external parties are involved
- Contradictory signals in the conversation

This project implements a **6-step decision pipeline** with deterministic signal computation + LLM semantic reasoning, backed by multi-layer safety fallback rules.

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/qq2690411774/Trae.git
cd Trae

# Backend
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install
```

### 2. Configure API Keys

You need at least one LLM provider API key:

```bash
# Option A: Set via environment variables
export OPENAI_API_KEY="sk-..."
export ZHIPU_API_KEY="..."

# Option B: Set via .env file (see backend/.env.example)

# Option C: Configure via UI at runtime (no restart needed!)
```

### 3. Start Services

```bash
# Terminal 1: Backend (port 8088)
cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8088

# Terminal 2: Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Live Demo

| Environment | URL |
|-------------|-----|
| **Frontend** | https://trae-frontend.up.railway.app/ |
| **Backend API** | https://trae-backend.up.railway.app/docs |
| **GitHub** | https://github.com/qq2690411774/Trae |

The live demo includes:
- ✅ 8 preloaded scenarios (2 easy, 2 ambiguous, 2 risky, 2 failure simulations)
- ✅ Multi-model support (GLM-5.1, GLM-5V-Turbo, GPT-4o-mini)
- ✅ Runtime API Key configuration via UI
- ✅ Full pipeline trace visualization (Inputs → Signals → Prompt → Raw Output → Final Decision)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌────────────┐ ┌─────────────┐ ┌────────────────────────┐   │
│  │ Scenario   │ │ Decision    │ │ API Key Configuration │   │
│  │ List       │ │ Input Panel │ │ Panel                 │   │
│  └────────────┘ └─────────────┘ └────────────────────────┘   │
│  ┌──────────────────┐  ┌─────────────────────────────────┐   │
│  │ Decision Result  │  │ Pipeline View (Full Trace)      │   │
│  │ Card             │  │                                 │   │
│  └──────────────────┘  └─────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP API
┌──────────────────────────▼──────────────────────────────────┐
│                       Backend (FastAPI)                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Decision Pipeline (6 Steps)              │     │
│  │                                                     │     │
│  │  1. Input Parser     → Standardize input            │     │
│  │  2. Signal Engine    → 8 deterministic signals       │     │
│  │  3. Prompt Builder   → Context-aware prompt          │     │
│  │  4. LLM Caller       → Model inference               │     │
│  │  5. Output Parser    → Structured JSON parsing        │     │
│  │  6. Decision Finalizer → Safety fallback & override   │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────┐  ┌────────────────┐                   │
│  │ 8 Scenarios    │  │ 3 LLM Models   │                   │
│  └────────────────┘  └────────────────┘                   │
└────────────────────────────────────────────────────────────┘
```

---

## Decision Pipeline

The system processes each decision through a **6-stage pipeline**, producing a complete `PipelineTrace` that records every step's input and output for transparency.

### Stage 1: Input Parser
Normalizes raw input into a standardized dictionary, extracting action type, message, history, and simulation flags.

### Stage 2: Signal Engine (Deterministic)
Computes **8 signals purely from code** — no LLM involved. These form the foundation for both the prompt sent to the LLM and the safety fallback rules.

### Stage 3: Prompt Builder
Constructs a structured prompt with:
- System role definition
- 5 available decision types with boundaries
- Deterministic signals injected as JSON
- Strict output format specification

### Stage 4: LLM Caller
Calls the selected model via OpenAI-compatible API with:
- 30-second timeout
- 1 retry on transient errors
- Support for failure simulation (timeout/malformed output)

### Stage 5: Output Parser
Extracts and validates structured JSON from LLM response:
- Regex-based JSON extraction
- Single-quote repair attempt
- Keyword-based decision type normalization
- Graceful degradation on parse failure

### Stage 6: Decision Finalizer
Applies **3 layers of safety rules** to ensure the final decision is safe, even if the LLM made an unsafe recommendation.

---

## Signal System: What We Compute and Why

We compute **8 deterministic signals** before involving the LLM. This design choice is critical:

| # | Signal | Type | How It's Computed | Why It Matters |
|---|--------|------|-------------------|---------------|
| 1 | `action_risk_level` | Lookup table | Maps `action_type` → LOW/MEDIUM/HIGH | Establishes baseline risk independent of context |
| 2 | `is_irreversible` | Lookup table | Hardcoded per action type (send_email=True, set_reminder=False) | Irreversible actions need confirmation by default |
| 3 | `involves_external_party` | Lookup table | Hardcoded per action type (create_calendar=True, set_reminder=False) | External parties elevate risk and require notification |
| 4 | `has_explicit_confirmation` | Keyword matching | Checks latest message against 26 confirmation words (English + Chinese) | Detects explicit user approval |
| 5 | `has_contradictory_signals` | Pattern detection | Scans history for co-occurring hold words ("wait", "hold off") and confirm words | Reveals user indecision or context conflicts |
| 6 | `has_conversation_history` | Boolean check | `len(history) > 0` | Determines whether we have context beyond the latest message |
| 7 | `history_message_count` | Integer count | `len(history)` | Richness indicator for context quality |
| 8 | `user_trust_level` | From input | Extracted from `user_state.trust_level` (default: "medium") | Future-proofing for personalized thresholds |

**Why deterministic signals first?**
- They are **fast, reliable, and reproducible** — no LLM latency or variability
- They provide **ground truth anchors** for the LLM's reasoning
- They enable **graceful degradation** when the LLM is unavailable
- They make the system **debuggable and auditable** — every decision can be traced to specific signals

---

## LLM vs Code: Responsibility Split

This is the most important architectural decision in the system. Here's how we divide labor:

### What the LLM Decides (Semantic Reasoning Required)

| Task | Why LLM Is Needed |
|------|------------------|
| **Intent resolution** | Understanding whether the user's true intent is clear requires parsing natural language nuance across multiple messages |
| **Key parameter detection** | Identifying which parameters are missing (recipient? subject? time?) needs semantic understanding |
| **Contextual risk assessment** | Evaluating whether a specific conversation context elevates or mitigates risk requires understanding meaning, not just pattern matching |
| **Rationale generation** | Explaining *why* a decision was made in natural language is inherently an LLM strength |
| **Confidence scoring** | Estimating how certain the system should be about its decision benefits from probabilistic reasoning |

### What Code Computes Deterministically (No LLM Needed)

| Task | Why Code Is Better |
|------|-------------------|
| **Action risk mapping** | A lookup table is faster, more reliable, and easier to audit than asking an LLM to classify risk |
| **Irreversibility detection** | Binary property of action type — no ambiguity |
| **Confirmation word detection** | Exact keyword matching across 26 known words (bilingual) — code never misses or hallucinates |
| **Hold word detection** | Same as above — pattern matching is perfect here |
| **Contradictory signal detection** | Boolean logic: hold ∧ confirm in history = contradiction |
| **Safety fallback rules** | When LLM fails, code MUST take over — these rules must be deterministic and testable |
| **Final decision overrides** | Rules like "irreversible + external → always confirm" are safety-critical and shouldn't depend on LLM agreement |

**The key insight**: Code handles **rules that must always be enforced**, while the LLM handles **judgment calls that require understanding**. When they disagree, code wins.

---

## Prompt Design

The prompt follows a structured format optimized for consistent JSON output:

```
[System Role]
You are alfred_'s Execution Decision Engine...

[Decision Types]
1. EXECUTE_SILENTLY - Execute without notifying...
2. EXECUTE_AND_TELL - Execute and notify after...
3. CONFIRM_FIRST - Ask for confirmation before executing...
4. ASK_CLARIFYING - Ask when intent/entity/parameters unresolved...
5. REFUSE_ESCALATE - Refuse when policy disallows or risk too high...

[Decision Boundaries]
- ASK_CLARIFYING when intent, entity, or parameters unresolved
- CONFIRM_FIRST when intent resolved but risk above threshold
- REFUSE_ESCALATE when policy disallows or uncertainty remains too high

[Deterministic Signals - Injected as JSON]
{
  "action_risk_level": "HIGH",
  "is_irreversible": true,
  "involves_external_party": true,
  "has_explicit_confirmation": false,
  "has_contradictory_signals": true,
  ...
}

[Output Format - Strict JSON]
{
  "decision": "<EXECUTE_SILENTLY|EXECUTE_AND_TELL|...>",
  "confidence": <0.0-1.0>,
  "intent_resolved": <true|false>,
  "key_parameters": {"recipient": <true|false>, ...},
  "risk_assessment": "<LOW|MEDIUM|HIGH>",
  "rationale": "<concise explanation>"
}

[User Context]
Action: {action}
Latest message: {latest_message}
Conversation history:
  [1] {msg_1}
  [2] {msg_2}
  ...
```

**Design choices**:
- **Signals injected as JSON**: Gives the LLM structured context it can reason about explicitly
- **Strict output format**: Reduces parsing complexity and error rate
- **Decision boundaries stated upfront**: Anchors the LLM's reasoning framework
- **Temperature = 0.1**: Minimizes creativity, maximizes consistency for decision-making

---

## Safety & Failure Handling

The system is designed with **defense in depth**. If any component fails, there's always a safe default.

### Expected Failure Modes & Mitigations

| Failure Mode | Detection | Mitigation | Fallback Behavior |
|--------------|----------|------------|-------------------|
| **LLM Timeout** (>30s) | `asyncio.TimeoutError` caught | Trigger deterministic fallback rules | Tiered handling based on signals (see below) |
| **Malformed Output** (non-JSON) | JSON parse failure | Attempt extraction/repair; fall back to keyword matching | Use extracted decision type or default to CONFIRM_FIRST |
| **Model Not Configured** | No API Key set | Return error; frontend shows "0 models available" | Cannot make LLM decisions; falls back to pure deterministic rules |
| **Missing Critical Context** | Empty action/message | Detected in finalizer | Force ASK_CLARIFYING |
| **LLM Error** (API failure) | Exception caught | Retry once; then fallback | Same as timeout path |

### Three-Layer Safety Fallback Engine

When the LLM is unavailable or produces untrustworthy output, the **Decision Finalizer** applies layered rules:

**Layer 1: Hard Rejections (Non-negotiable)**
```
IF action contains batch deletion keywords ("delete all", "remove all", ...)
   OR (competitor keywords AND sensitive info keywords):
   → FORCE REFUSE_ESCALATE
```
These actions are never safe to execute, regardless of LLM opinion.

**Layer 2: Tiered Fallback (When LLM Unavailable)**
```
IF critical context missing        → ASK_CLARIFYING
ELIF high risk AND no confirmation  → ASK_CLARIFYING
ELIF low risk AND reversible AND confirmed → EXECUTE_AND_TELL
ELIF low risk AND reversible AND not confirmed → EXECUTE_SILENTLY
ELSE                                → CONFIRM_FIRST  (safe default)
```
This tier respects the inherent properties of the action while being conservative.

**Layer 3: Rule Overrides (Even When LLM Succeeds)**
```
IF LLM says EXECUTE_SILENTLY BUT intent is unresolved     → Correct to ASK_CLARIFYING
IF LLM says EXECUTE_SILENTLY BUT irreversible+external     → Override to CONFIRM_FIRST
IF LLM says EXECUTE_SILENTLY BUT irreversible+no confirm    → Override to CONFIRM_FIRST
IF LLM says silent-type BUT contradictory signals exist    → Override to CONFIRM_FIRST
```
These overrides catch cases where the LLM might be overly aggressive due to incomplete context understanding.

**Design philosophy**: *Better to ask too often than to execute mistakenly.* The default safe behavior is CONFIRM_FIRST — we never silently execute when uncertain.

---

## Preloaded Scenarios

The system includes **8 preloaded scenarios** demonstrating the full range of decision types:

| # | Category | Title | Action | Expected Decision | Key Challenge |
|---|----------|-------|--------|------------------|---------------|
| 1 | Easy | Set reminder to drink water | Set reminder at 3pm | **EXECUTE_SILENTLY** | Low risk, reversible, clear intent |
| 2 | Easy | Schedule team meeting | Create Friday 2pm meeting | **EXECUTE_AND_TELL** | Low risk but involves others |
| 3 | Ambiguous | Send email (missing details) | "Send an email for me" | **ASK_CLARIFYING** | Missing recipient, subject, content |
| 4 | Ambiguous | Send after hold signal | "Yep, send it" (after "hold off for legal") | **CONFIRM_FIRST** | Contradictory history — legal status unclear |
| 5 | Risky | Delete all calendar events | "Delete all my calendar events" | **REFUSE_ESCALATE** | Batch irreversible deletion |
| 6 | Risky | Send contract to competitor | "Send contract terms to competitor" | **REFUSE_ESCALATE** | Confidentiality/legal risk |
| 7 | Failure | LLM Timeout Simulation | Delete old sync + simulate_timeout | **CONFIRM_FIRST** (fallback) | Demonstrates timeout safety |
| 8 | Failure | Malformed Output Simulation | Set lunch reminder + simulate_malformed | **CONFIRM_FIRST** (fallback) | Demonstrates parse failure recovery |

**Scenario 4 is particularly important**: It demonstrates that the system does NOT judge the latest message in isolation. The user said "hold off until legal reviews pricing language" then later said "Yep, send it" — but the legal review status is still unknown. A naive system would see "Yep, send it" and execute silently. Our system detects the contradictory signals and requires confirmation.

---

## API Reference

### Base URL
- Local: `http://localhost:8088/api`
- Production: `https://trae-backend.up.railway.app/api`

### Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/decision` | Submit custom decision request | `DecisionInput` | `DecisionOutput` + `PipelineTrace` |
| GET | `/api/scenarios` | List all preloaded scenarios | — | `list[Scenario]` (8 items) |
| POST | `/api/decision/scenario/{id}` | Run a scenario | Query: `model_id?` | `DecisionOutput` + `PipelineTrace` |
| GET | `/api/models` | List available models & status | — | `list[ModelInfo]` |
| POST | `/api/models/api-key` | Configure runtime API key | `{env_var, api_key}` | `{status, configured, models_updated}` |
| GET | `/health` | Health check | — | `{status: "ok"}` |

### Example Request

```json
POST /api/decision
Content-Type: application/json

{
  "action": "Send email reply to Acme Corp about pricing",
  "latest_message": "Yes, go ahead and send it",
  "conversation_history": [
    "User: Draft a reply to Acme proposing 20% discount",
    "alfred_: Draft complete. Shall I send?",
    "User: Actually wait for legal review first"
  ],
  "action_type": "send_email",
  "model_id": "glm-5.1"
}
```

### Example Response

```json
{
  "decision": "CONFIRM_FIRST",
  "confidence": 0.87,
  "rationale": "User previously said to wait for legal review, then said 'go ahead'. Legal review status is unclear. Confirming before sending.",
  "risk_assessment": "HIGH",
  "intent_resolved": true,
  "key_parameters": {"recipient": true, "subject": true, "content": true},
  "model_used": "glm-5.1",
  "fallback_used": false,
  "pipeline_trace": {
    "inputs": {...},
    "signals": {
      "action_risk_level": "HIGH",
      "is_irreversible": true,
      "involves_external_party": true,
      "has_explicit_confirmation": true,
      "has_contradictory_signals": true,
      ...
    },
    "prompt": "[Full prompt text...]",
    "raw_llm_output": "{\"decision\": \"CONFIRM_FIRST\", ...}",
    "final_decision": "CONFIRM_FIRST",
    "final_rationale": "Contradictory signals in conversation history require confirmation...",
    "error": null
  }
}
```

Interactive API documentation available at `/docs` (Swagger UI).

---

## Technology Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| **Backend Framework** | FastAPI | ≥0.104.0 | Async-native, auto-generated OpenAPI docs, Pydantic validation |
| **ASGI Server** | Uvicorn | ≥0.24.0 | High-performance async HTTP server |
| **Frontend Framework** | React + Vite | Vite 8.0.8 | Fast HMR, optimized builds, simple tooling |
| **LLM SDK** | OpenAI Python | ≥1.0.0 | Unified interface for OpenAI-compatible providers |
| **Data Validation** | Pydantic | ≥2.0.0 | Type-safe request/response models |
| **Deployment** | Railway | — | Zero-config CI/CD, auto-scaling |

### Supported LLM Models

| Model ID | Provider | Base URL | Default |
|----------|----------|----------|---------|
| `glm-5.1` | ZhipuAI | `https://open.bigmodel.cn/api/paas/v4` | ✅ Yes |
| `glm-5v-turbo` | ZhipuAI | `https://open.bigmodel.cn/api/paas/v4` | |
| `gpt-4o-mini` | OpenAI | `https://api.openai.com/v1` | |

All models accessed via unified OpenAI-compatible interface. Switchable at runtime via UI dropdown.

---

## Evolution Roadmap

### As alfred_ Gains Riskier Tools

If this system were to evolve alongside alfred_'s expanding capabilities, here's how I'd approach it:

#### 1. Per-Tool Action Policies
Replace the single flat risk mapping with **tool-specific policies**:
- Financial transactions: Amount thresholds, dual-approval for >$X
- Data access operations: Sensitivity levels (PII, internal, public)
- External communications: Domain allowlists, content scanning
- Calendar modifications: Recurring event protection, conflict detection

#### 2. User Trust Calibration
Move from static `user_trust_level` to a **learned trust score**:
- Track how often users accept vs. override confirmations
- Gradually expand autonomous execution scope for high-trust users
- Detect trust erosion (frequent overrides → increase caution)

#### 3. Multi-Factor Risk Score
Combine deterministic signals + LLM assessment into a **weighted numerical risk score**:
- Enables fine-grained threshold tuning
- Supports A/B testing of decision boundaries
- Provides audit trail with quantifiable metrics

#### 4. Decision Audit Trail
Persist all decisions with full pipeline traces:
- Post-hoc analysis of decision patterns
- Identify edge cases where the system was wrong
- Feed corrections back into policy engine

#### 5. Progressive Autonomy Tiers
Define clear autonomy levels with promotion criteria:
- **Tier 1 (Current)**: Always confirm for irreversible/external actions
- **Tier 2**: Auto-confirm for low-risk recurring actions (user-approved patterns)
- **Tier 3**: Silent execution for trusted action families (with human audit sampling)

### What I'd Build Next (6-Month Roadmap)

If I owned this system for the next 6 months, here's my priority order:

**Months 1-2: Foundation Strengthening**
- [ ] User trust calibration engine with learning feedback loop
- [ ] Per-tool action policy configuration system
- [ ] Comprehensive unit + integration test suite (pytest, coverage >90%)
- [ ] Structured logging pipeline (JSON logs, correlation IDs)

**Months 2-3: Conversation Intelligence**
- [ ] Multi-turn clarification flow (currently single-shot decision)
- [ ] Conversation state machine (track clarification progress across turns)
- [ ] Intent persistence (remember what was asked across sessions)
- [ ] Sentiment drift detection (user frustration indicators)

**Months 3-4: Observability & Optimization**
- [ ] Metrics dashboard (decision distribution, fallback rate, latency P99)
- [ ] A/B testing framework for decision thresholds
- [ ] Prompt versioning and evaluation harness
- [ ] Fine-tuned decision classifier on real conversation data (replace prompt engineering)

**Months 4-5: Production Readiness**
- [ ] Human-in-the-loop feedback system (user rates decisions)
- [ ] Automated policy updates from edge case analysis
- [ ] Rate limiting and abuse prevention
- [ ] Multi-user isolation and tenant support

**Months 5-6: Advanced Capabilities**
- [ ] Temporal reasoning (time-sensitive actions, deadlines)
- [ ] Cross-action dependency detection (don't delete calendar if meeting depends on it)
- [ ] Personalized decision style adaptation (some users prefer more confirmation, some less)
- [ ] Integration with actual email/calendar APIs (move from prototype to production)

---

## What I Chose Not To Build (And Why)

| Feature | Reason for Exclusion |
|---------|---------------------|
| **User authentication** | Prototype scope; adds complexity without changing core decision logic |
| **Database persistence** | Stateless decisions; scenarios hardcoded; API keys in memory by design |
| **Rate limiting** | Single-user prototype; would add value in production |
| **Streaming LLM responses** | Decision output is small (<500 tokens); streaming adds complexity without UX benefit |
| **Multi-turn clarification flow** | Natural next step, but single-shot covers the challenge requirements |
| **Caching layer** | Decisions are context-dependent; caching could serve stale results |
| **Internationalization (i18n)** | Core logic is language-agnostic; UI already bilingual in signal detection |
| **WebSocket support** | REST is sufficient for request-response decision pattern |

Each of these would be valuable in production but would have distracted from the core goal: **demonstrating sound judgment in scoping, design clarity, and clean execution within the 6-hour timebox**.

---

## Project Structure

```
alfred/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, static files
│   ├── models.py                # 12 Pydantic models
│   ├── config.py                # LLM config, CORS origins, API key management
│   ├── routes.py                # 7 API endpoints
│   ├── scenarios.py             # 8 preloaded scenarios
│   ├── pipeline/
│   │   ├── input_parser.py      # Input standardization
│   │   ├── signal_engine.py     # 8 deterministic signals
│   │   ├── prompt_builder.py    # Structured prompt construction
│   │   ├── llm_caller.py        # Multi-model LLM invocation
│   │   ├── output_parser.py     # JSON extraction & repair
│   │   └── decision_finalizer.py # 3-layer safety fallback engine
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main application
│   │   ├── api.js               # API client
│   │   └── components/
│   │       ├── ScenarioList.jsx
│   │       ├── DecisionInput.jsx
│   │       ├── DecisionResult.jsx
│   │       ├── PipelineView.jsx
│   │       └── ApiKeyConfig.jsx
│   └── package.json
├── spec.md                      # Technical specification
├── tasks.md                     # Task checklist (29/29 completed)
├── checklist.md                 # Test plan (57 test cases)
└── README.md                    # This file
```

---

## License

MIT License — free to use, modify, and distribute.

---

*Built for the alfred_ Application Challenge. Designed with judgment, clarity, and safety in mind.*
