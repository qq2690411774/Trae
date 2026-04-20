# alfred_ Execution Decision Layer — Task Checklist

> **Project Status**: ✅ Completed and Deployed
>
> **Completion Date**: 2026-04-20
>
> **Deployment URLs**:
> - Frontend: https://trae-frontend.up.railway.app/
> - Backend: https://trae-backend.up.railway.app/
> - GitHub: https://github.com/qq2690411774/Trae

---

## Phase 1: Backend Core Development ✅ Completed

### Task 1.1: Project Initialization & Data Models ✅
- [x] Create `backend/` directory structure
- [x] Define Pydantic data models (12 model classes):
  - `DecisionType` (enum) - 5 decision types
  - `RiskLevel` (enum) - LOW/MEDIUM/HIGH
  - `ActionType` (enum) - 8 action types
  - `DecisionInput` - Input model (including simulate_timeout, simulate_malformed, model_id)
  - `SignalResult` - Signal result (8 deterministic signals)
  - `LLMOutput` - LLM output structure
  - `PipelineTrace` - Complete pipeline trace
  - `DecisionOutput` - Final output
  - `Scenario` - Scenario definition
  - `ModelInfo` - Model information
- [x] Configure FastAPI application entry point `main.py`
  - CORS middleware configuration
  - API route mounting (/api)
  - Static file serving (frontend dist)
  - 404 handling (SPA fallback)
- [x] Configure environment variable management `config.py`
  - LLM_MODELS configuration (3 models)
  - DEFAULT_MODEL = "glm-5.1"
  - LLM_TIMEOUT = 30s
  - LLM_MAX_RETRIES = 1
  - CORS_ORIGINS (local + production environments)
  - Runtime API Key management

### Task 1.2: Deterministic Signal Engine ✅
- [x] Implement `signal_engine.py`
- [x] Action risk mapping table (8 action_types → risk_level, is_irreversible, involves_external)
- [x] Confirmation word detection (17 English + 9 Chinese confirmation words)
- [x] Hold word / pause word detection (7 English + 6 Chinese pause words)
- [x] Conversation history analysis signals:
  - has_conversation_history
  - history_message_count
  - has_contradictory_signals (both hold and confirm signals present)
- [x] User trust level reading (user_trust_level)

### Task 1.3: Prompt Builder ✅
- [x] Implement `prompt_builder.py`
- [x] Structured prompt template (System + User sections)
- [x] System Prompt includes:
  - 5 available decision descriptions
  - Decision boundary definitions
  - Deterministic signal injection (8 signals as JSON)
  - Strict JSON output format requirement
- [x] Dynamic injection of deterministic signals into prompt
- [x] Conversation history formatting (with sequence numbers)

### Task 1.4: LLM Caller Layer ✅
- [x] Implement `llm_caller.py`
- [x] OpenAI-compatible interface integration (AsyncOpenAI)
- [x] Multi-model support (GLM-5.1, GLM-5V-Turbo, GPT-4o-mini)
- [x] Timeout control (default 30s, via asyncio.wait_for)
- [x] Retry mechanism (LLM_MAX_RETRIES=1 time)
- [x] Error capture and exception type definitions:
  - LLM_TIMEOUT
  - LLM_ERROR:{message}
  - MODEL_NOT_CONFIGURED:{model_id}
- [x] **Failure simulation features** (beyond requirements):
  - simulate_timeout=True → force timeout
  - simulate_malformed=True → return non-JSON text

### Task 1.5: Output Parser ✅
- [x] Implement `output_parser.py`
- [x] JSON output extraction (regex matching + start/end delimiter extraction)
- [x] Abnormal format repair attempts:
  - Regex extraction of innermost JSON object
  - Single quote to double quote replacement
- [x] Degradation handling on parse failure:
  - Normalize decision type from raw text
  - Truncate to first 200 characters as rationale
- [x] Field validation and normalization:
  - Decision type mapping and correction
  - Confidence range limiting [0.0, 1.0]
  - Risk assessment standardization

### Task 1.6: Decision Finalizer & Safety Fallback ✅
- [x] Implement `decision_finalizer.py`
- [x] **Three-layer safety fallback rule engine**:

  **Layer 1: High-Risk Action Forced Rejection**
  - [x] Batch deletion keyword detection (bilingual)
  - [x] Competitor + sensitive info combination detection
  - [x] Force REFUSE_ESCALATE

  **Layer 2: Tiered Handling When LLM Unavailable**
  - [x] Missing critical context → ASK_CLARIFYING
  - [x] High risk without confirmation → ASK_CLARIFYING
  - [x] Low risk reversible with confirmation → EXECUTE_AND_TELL
  - [x] Low risk reversible without confirmation → EXECUTE_SILENTLY
  - [x] Other cases → CONFIRM_FIRST (default safety strategy)

  **Layer 3: Rule Override in Normal Cases**
  - [x] Intent unresolved + silent execution → Correct to ASK_CLARIFYING
  - [x] Irreversible + involves external + silent → CONFIRM_FIRST
  - [x] Irreversible + no confirmation word + silent → CONFIRM_FIRST
  - [x] Contradictory signals + silent-type decision → CONFIRM_FIRST

### Task 1.7: Pipeline Orchestration ✅
- [x] Implement pipeline orchestration logic (in routes.py's run_pipeline function)
- [x] Chain 6 steps:
  1. Input Parser → parsed dict
  2. Signal Engine → SignalResult (8 signals)
  3. Prompt Builder → structured prompt string
  4. LLM Caller → raw_output + model_or_error
  5. Output Parser → LLMOutput + parse_failed flag
  6. Decision Finalizer → final PipelineTrace
- [x] Generate complete PipelineTrace object (records input/output of each step)
- [x] Error propagation and fallback flag setting

### Task 1.8: API Endpoints ✅
- [x] `POST /api/decision` — Submit custom decision request
- [x] `GET /api/scenarios` — Get preloaded scenario list (8 items)
- [x] `POST /api/decision/scenario/{id}` — Execute specified preloaded scenario (supports query param model_id)
- [x] `GET /api/models` — Get available model list with status
- [x] `POST /api/models/api-key` — Configure runtime API Key
- [x] `GET /health` — Health check (includes static directory status)
- [x] `GET /api/debug` — Debug information endpoint
- [x] Auto-generate FastAPI documentation (/docs)

### Task 1.9: Preloaded Scenarios ✅
- [x] Implement `scenarios.py`
- [x] **8 preloaded scenarios** (exceeds requirement of 6):
  - [x] Scenario 1: Set reminder (Easy - EXECUTE_SILENTLY)
  - [x] Scenario 2: Team meeting (Easy - EXECUTE_AND_TELL)
  - [x] Scenario 3: Send email missing details (Ambiguous - ASK_CLARIFYING)
  - [x] Scenario 4: Hold signal contradiction (Ambiguous - CONFIRM_FIRST)
  - [x] Scenario 5: Delete all calendar (Risky - REFUSE_ESCALATE)
  - [x] Scenario 6: Send to competitor (Risky - REFUSE_ESCALATE)
  - [x] Scenario 7: LLM Timeout Simulation (Failure - CONFIRM_FIRST)
  - [x] Scenario 8: Malformed Output Simulation (Failure - CONFIRM_FIRST)
- [x] Each scenario includes complete input data and expected decision description
- [x] get_scenario_by_id() query function

---

## Phase 2: Frontend Development ✅ Completed

### Task 2.1: Frontend Project Initialization ✅
- [x] Initialize project using Vite 8.0.8 + React
- [x] Install dependencies (package.json)
- [x] Configure API proxy (vite.config.js → localhost:8088)
- [x] Configure production environment variables (.env.production → Railway backend URL)

### Task 2.2: Scenario Selector Component ✅
- [x] Implement `ScenarioList.jsx`
- [x] Preloaded scenario list display (8 scenarios)
- [x] Click scenario to auto-fill input and trigger decision
- [x] Scenario category labels (easy/ambiguous/risky/failure)
- [x] Selected state highlight display

### Task 2.3: Decision Input Component ✅
- [x] Implement `DecisionInput.jsx`
- [x] Action Type dropdown selection (8 action types)
- [x] Action required input field
- [x] Latest Message required input field (multi-line text box)
- [x] Conversation History optional input field (multi-line text box, one message per line)
- [x] LLM Model dropdown selection (dynamically fetched from backend)
- [x] Submit Decision button (with loading state)

### Task 2.4: Decision Result Component ✅
- [x] Implement `DecisionResult.jsx`
- [x] Display decision type (with emoji icon differentiation)
- [x] Display confidence (0-1 float)
- [x] Display rationale
- [x] Display risk assessment (LOW/MEDIUM/HIGH)
- [x] Display whether intent is resolved (intent_resolved)
- [x] Display key parameter status (key_parameters)
- [x] Display used model (model_used)
- [x] Display whether fallback logic was used (fallback_used)

### Task 2.5: Pipeline View Component ✅
- [x] Implement `PipelineView.jsx`
- [x] Step-by-step display of complete pipeline 5 steps:
  1. Inputs (input data)
  2. Signals (8 deterministic signals)
  3. Prompt (complete prompt, scrollable view)
  4. Raw LLM Output (raw model output)
  5. Final Decision (final decision)
- [x] Show/Hide Pipeline collapse button
- [x] Each step expandable to view detailed content

### Task 2.6: Failure State Display ✅
- [x] Timeout warning indicator (⚠️ Error message)
- [x] Parse failure prompt (shown when fallback_used=true)
- [x] Fallback decision explanation (detailed rationale)
- [x] Loading state display (⏳ Analyzing decision pipeline...)
- [x] Error state display (red background error card)

### Task 2.7: API Key Configuration Component ✅ (Extra Implementation)
- [x] Implement `ApiKeyConfig.jsx`
- [x] Collapsible panel design
- [x] Provider selection (ZhipuAI / OpenAI)
- [x] API Key password input field
- [x] Save API Key button (with loading state)
- [x] Configured Key status indicator (green ✓ / red ✗)
- [x] Success/error prompt messages
- [x] Auto-refresh models list after successful configuration

---

## Phase 3: Integration, Testing & Deployment ✅ Completed

### Task 3.1: Frontend-Backend Integration ✅
- [x] Start backend service (uvicorn, port 8088)
- [x] Start frontend dev server (Vite, port 5173)
- [x] Vite proxy configuration correct (/api → localhost:8088)
- [x] All API endpoints respond normally
- [x] CORS configuration correct (local + production environment domains)

### Task 3.2: Scenario Verification ✅
- [x] 8 preloaded scenarios load and display normally
- [x] Clicking scenario triggers decision request
- [x] Decision results display correctly
- [x] Pipeline view data complete (all 5 steps have content)
- [x] Model switching functionality works correctly

### Task 3.3: Failure Path Testing ✅
- [x] Scenario 7 (LLM Timeout) demonstrates timeout fallback behavior
- [x] Scenario 8 (Malformed Output) demonstrates malformed output fallback behavior
- [x] UI correctly displays ⚠️ warning indicators
- [x] fallback_used flag correctly set to True
- [x] Fallback decisions comply with safety rules

### Task 3.4: Deploy to Railway ✅
- [x] Backend deployed to Railway (trae-backend.up.railway.app)
- [x] Frontend deployed to Railway (trae-frontend.up.railway.app)
- [x] Configure Wait for CI (auto-deployment trigger)
- [x] CORS production environment domain configuration
- [x] GitHub push triggers auto-deployment
- [x] Production environment access verification

---

## Phase 4: Documentation ✅ Completed

### Task 4.1: spec.md Update ✅
- [x] Project overview and current status
- [x] System architecture diagram (updated to actual architecture)
- [x] Decision pipeline detailed design (based on actual code)
- [x] 8 deterministic signals explanation
- [x] Three-layer safety fallback rule engine documentation
- [x] 8 preloaded scenario detailed descriptions
- [x] 7 API endpoint documentation
- [x] Frontend component list and interaction flow
- [x] Technology stack and version numbers
- [x] Design highlights and trade-off explanations

### Task 4.2: tasks.md Update ✅
- [x] All tasks marked with completion status
- [x] Added actual implementation details
- [x] Recorded extra implemented features
- [x] Added deployment information

### Task 4.3: checklist.md Update ✅
- [x] Functional test cases (F-01 ~ F-08, expanded to 8 scenarios)
- [x] Signal engine test cases (S-01 ~ S-08, added contradiction signals etc.)
- [x] Safety fallback rule test cases (G-01 ~ G-05, expanded multi-layer rules)
- [x] API endpoint test cases (A-01 ~ A-09, added models/api-key/debug)
- [x] Failure path test cases (E-01 ~ E-04, added model not configured)
- [x] Frontend UI test cases (U-01 ~ U-10, added API Key config etc.)
- [x] End-to-end integration test cases (I-01 ~ I-05)
- [x] Acceptance criteria checklist

---

## Execution Timeline

```
✅ Task 1.1 → ✅ Task 1.2 → ✅ Task 1.3 → ✅ Task 1.4 → ✅ Task 1.5 → ✅ Task 1.6 → ✅ Task 1.7 → ✅ Task 1.8 → ✅ Task 1.9
                                                                                              ↓
✅ Task 2.1 → ✅ Task 2.2 → ✅ Task 2.3 → ✅ Task 2.4 → ✅ Task 2.5 → ✅ Task 2.6 → ✅ Task 2.7 ──→ ✅ Task 3.1
                                                                                              ↓
                                                                              ✅ Task 3.2 → ✅ Task 3.3 → ✅ Task 3.4
                                                                                                              ↓
                                                                              ✅ Task 4.1 → ✅ Task 4.2 → ✅ Task 4.3
```

**Total**: All 29 tasks completed ✅

---

## Extra Features Beyond Requirements

| Feature | Description | Value |
|---------|-------------|-------|
| Multi-model support | 3 switchable LLM models | Flexibility, fault tolerance, cost optimization |
| Runtime API Key configuration | Frontend UI configuration, no restart needed | User experience, security |
| 8 preloaded scenarios | Exceeds required 6, added 2 failure simulations | More comprehensive demonstration |
| Failure simulation features | simulate_timeout / simulate_malformed | Convenient testing and demo of fallback logic |
| Debug endpoint | /api/debug operations debug info | Development debugging convenience |
| Bilingual support | Confirmation/Hold/Risk keywords support Chinese | Internationalization capability |
| Complete PipelineTrace recording | Records input/output/error of every step | Transparency, traceability |
