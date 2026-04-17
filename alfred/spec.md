# alfred_ Execution Decision Layer — 总体方案

## 1. 项目概述

alfred_ 是一个运行在短信中的 AI 助手，帮助用户管理邮件、日历、提醒和日程。本项目的核心目标是**设计并实现一个执行决策层（Execution Decision Layer）**，决定 alfred_ 在面对用户请求时应该采取何种行动策略。

### 五种决策类型

| 决策 | 说明 |
|------|------|
| **Execute silently** | 静默执行，不打扰用户 |
| **Execute and tell after** | 执行后通知用户 |
| **Confirm before executing** | 执行前需用户确认 |
| **Ask a clarifying question** | 意图/参数不明确，需追问 |
| **Refuse / escalate** | 拒绝执行或升级处理 |

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  ┌───────────┐ ┌────────────┐ ┌───────────────────┐ │
│  │ 场景选择器 │ │ 决策提交面板 │ │ 决策详情(管线视图) │ │
│  └───────────┘ └────────────┘ └───────────────────┘ │
└────────────────────────┬────────────────────────────┘
                         │ HTTP API
┌────────────────────────▼────────────────────────────┐
│                 Backend (FastAPI)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Decision Pipeline (决策管线)         │   │
│  │                                               │   │
│  │  1. Input Parser ─── 输入解析与标准化          │   │
│  │  2. Signal Engine ── 确定性信号计算            │   │
│  │  3. Prompt Builder ─ 上下文感知的提示词构建     │   │
│  │  4. LLM Caller ──── 调用大模型推理             │   │
│  │  5. Output Parser ── 结构化输出解析             │   │
│  │  6. Decision Finalizer ─ 最终决策与安全兜底     │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ Scenario Store│  │ Failure Handler│               │
│  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────┘
```

---

## 3. 核心设计：决策管线 (Decision Pipeline)

### 3.1 输入模型

```python
class DecisionInput:
    action: str                    # 拟执行的动作描述
    latest_message: str            # 用户最新消息
    conversation_history: list[str] # 对话历史
    user_state: dict               # 用户状态（偏好、信任等级等）
    action_type: str               # 动作类型 (email/calendar/reminder/scheduling)
```

### 3.2 确定性信号引擎 (Signal Engine)

以下信号由代码**确定性计算**，不依赖 LLM：

| 信号 | 计算方式 | 用途 |
|------|---------|------|
| `action_risk_level` | 基于动作类型的风险映射表 | 判断动作固有风险 |
| `has_conversation_history` | 历史消息数量 > 0 | 判断是否有上下文 |
| `user_trust_level` | 用户状态中的信任等级 | 影响静默执行阈值 |
| `is_irreversible` | 动作类型是否不可逆（如发送邮件） | 触发确认机制 |
| `involves_external_party` | 是否涉及外部人员 | 提升风险等级 |
| `has_explicit_confirmation` | 最新消息是否包含确认词 | 判断用户意图 |

**动作风险映射表（初始值）：**

| 动作类型 | 固有风险 | 不可逆 | 涉及外部 |
|---------|---------|--------|---------|
| 发送邮件 | 高 | 是 | 是 |
| 日程创建 | 低 | 否 | 可能 |
| 日程删除 | 中 | 是 | 可能 |
| 提醒设置 | 低 | 否 | 否 |
| 提醒删除 | 低 | 否 | 否 |
| 邮件草稿 | 低 | 否 | 否 |

### 3.3 LLM 职责划分

**LLM 负责（需要语义理解）：**
- 分析对话历史中的意图演变
- 判断意图是否已完全解析
- 识别关键参数是否缺失
- 评估上下文中的风险信号
- 生成决策理由

**代码负责（确定性逻辑）：**
- 动作风险等级映射
- 不可逆动作检测
- 确认词检测
- 安全兜底（LLM 超时/异常时的默认行为）
- 最终决策的规则覆盖（如：高风险 + 不可逆 → 必须确认）

### 3.4 Prompt 设计

采用结构化 Prompt，包含以下部分：

```
System: 你是 alfred_ 的执行决策引擎。根据动作和上下文，决定应该采取哪种执行策略。

## 可选决策
1. EXECUTE_SILENTLY - 静默执行
2. EXECUTE_AND_TELL - 执行后通知
3. CONFIRM_FIRST - 执行前确认
4. ASK_CLARIFYING - 追问澄清
5. REFUSE_ESCALATE - 拒绝/升级

## 决策边界
- 当意图、实体或关键参数未解决时 → ASK_CLARIFYING
- 当意图已解决但风险高于静默执行阈值时 → CONFIRM_FIRST
- 当策略禁止该动作，或澄清后风险仍过高时 → REFUSE_ESCALATE

## 确定性信号
{signals_json}

## 输出格式（严格JSON）
{
  "decision": "<决策类型>",
  "confidence": <0-1>,
  "intent_resolved": <bool>,
  "key_parameters": {<参数名>: <是否已解析>},
  "risk_assessment": "<低/中/高>",
  "rationale": "<简洁理由>"
}

User:
动作: {action}
最新消息: {latest_message}
对话历史: {conversation_history}
```

### 3.5 安全兜底规则

当 LLM 不可用或输出异常时，按以下确定性规则兜底：

```
IF 不可逆动作 AND 涉及外部 → CONFIRM_FIRST
IF 不可逆动作 AND 无明确确认 → CONFIRM_FIRST
IF 关键上下文缺失 → ASK_CLARIFYING
IF 动作在拒绝策略列表中 → REFUSE_ESCALATE
ELSE → CONFIRM_FIRST  (默认安全策略：宁可多问，不可误执行)
```

---

## 4. 前端设计

### 4.1 页面布局

```
┌─────────────────────────────────────────────────┐
│  alfred_ Execution Decision Layer                │
├─────────────────────┬───────────────────────────┤
│                     │                           │
│   预置场景列表        │    决策详情 (Pipeline)      │
│   ┌───────────────┐ │  ┌─────────────────────┐  │
│   │ ✓ 场景1: 简单  │ │  │ 1. Inputs           │  │
│   │ ○ 场景2: 简单  │ │  │ 2. Signals          │  │
│   │ ○ 场景3: 模糊  │ │  │ 3. Prompt           │  │
│   │ ○ 场景4: 模糊  │ │  │ 4. Raw LLM Output   │  │
│   │ ○ 场景5: 风险  │ │  │ 5. Final Decision   │  │
│   │ ○ 场景6: 风险  │ │  └─────────────────────┘  │
│   └───────────────┘ │                           │
│                     │                           │
│   自定义输入         │    决策结果卡片              │
│   ┌───────────────┐ │  ┌─────────────────────┐  │
│   │ Action:       │ │  │ ✅ CONFIRM_FIRST     │  │
│   │ Message:      │ │  │ Confidence: 0.85     │  │
│   │ History:      │ │  │ Rationale: ...       │  │
│   │ [Submit]      │ │  └─────────────────────┘  │
│   └───────────────┘ │                           │
└─────────────────────┴───────────────────────────┘
```

### 4.2 核心交互

1. **场景选择**：点击预置场景，自动填充输入并执行决策
2. **自定义提交**：手动输入动作和上下文，提交获取决策
3. **管线展开**：点击任意决策结果，展开查看完整管线（输入→信号→Prompt→LLM输出→最终决策）
4. **失败演示**：至少一个场景展示 LLM 超时/异常的兜底行为

---

## 5. 技术选型

| 组件 | 技术 | 理由 |
|------|------|------|
| 后端框架 | FastAPI | 轻量、异步、自动生成API文档 |
| 前端框架 | React + Vite | 快速开发，简单UI足够 |
| LLM | 多模型可选（见下表） | 灵活切换，兼容不同场景与成本需求 |
| 部署 | 本地运行（可部署到 Vercel/Railway） | 满足挑战要求 |

### 5.1 支持的 LLM 模型

| 模型 | 提供商 | API 兼容 | 说明 |
|------|--------|---------|------|
| GPT-4o-mini | OpenAI | OpenAI SDK | 性价比高，推理能力稳定 |
| MiniMax-M2.5 | MiniMax | OpenAI 兼容 | 国产模型，中文理解强 |
| Doubao-Seed-Code | 字节跳动 | OpenAI 兼容 | 豆包系列，代码与推理能力好 |
| GLM-5.1 | 智谱AI | OpenAI 兼容 | 智谱旗舰模型，综合能力强 |
| GLM-5V-Turbo | 智谱AI | OpenAI 兼容 | 智谱轻量快速模型 |
| Kimi-K2.5 | Moonshot | OpenAI 兼容 | 长上下文能力突出 |
| Qwen3.6-Plus | 阿里云 | OpenAI 兼容 | 通义千问，中文能力优秀 |

**模型切换机制**：
- 后端通过统一的 OpenAI 兼容接口调用所有模型
- 每个模型配置独立的 `base_url`、`api_key`、`model_name`
- 前端提供模型选择下拉框，用户可实时切换
- 决策管线中的 `PipelineTrace` 记录所使用的模型信息
- 默认模型：GPT-4o-mini

---

## 6. 预置场景设计

### 场景1（简单 - 静默执行）
- **动作**: 设置提醒"下午3点喝水"
- **最新消息**: "提醒我下午3点喝水"
- **预期决策**: EXECUTE_SILENTLY — 低风险、不可逆、意图明确

### 场景2（简单 - 执行后通知）
- **动作**: 创建日历事件"周五团队会议"
- **最新消息**: "帮我安排周五下午2点团队会议"
- **预期决策**: EXECUTE_AND_TELL — 低风险、意图明确、涉及他人但风险可控

### 场景3（模糊 - 需追问）
- **动作**: 发送邮件
- **最新消息**: "帮我发个邮件"
- **预期决策**: ASK_CLARIFYING — 缺少收件人、主题、内容等关键参数

### 场景4（模糊 - 上下文冲突需确认）
- **动作**: 发送邮件回复外部合作伙伴
- **最新消息**: "发吧"
- **对话历史**: 用户之前让 alfred_ 起草给 Acme 的回复（提议20%折扣）；alfred_ 起草后请求确认；用户说"等法务审核完再发"；几分钟后用户说"发吧"
- **预期决策**: CONFIRM_FIRST — 意图可能已变，但上下文有矛盾（法务审核状态不明），需确认

### 场景5（风险 - 拒绝执行）
- **动作**: 删除所有日历事件
- **最新消息**: "帮我把日历全删了"
- **预期决策**: REFUSE_ESCALATE — 批量删除不可逆、风险极高

### 场景6（风险 - 需确认的高风险操作）
- **动作**: 发送含敏感信息的邮件给外部
- **最新消息**: "把这个合同条款发给竞争对手公司"
- **预期决策**: REFUSE_ESCALATE 或 CONFIRM_FIRST — 涉及敏感信息外泄风险

---

## 7. 失败处理设计

| 失败类型 | 处理策略 | UI 展示 |
|---------|---------|--------|
| LLM 超时 | 触发确定性兜底规则，默认 CONFIRM_FIRST | 显示 ⚠️ 超时警告 + 兜底决策说明 |
| 模型输出格式异常 | 尝试 JSON 修复；失败则走兜底规则 | 显示 ⚠️ 输出解析失败 + 原始输出 |
| 关键上下文缺失 | 直接 ASK_CLARIFYING | 显示 ⚠️ 上下文不足提示 |

---

## 8. 项目目录结构

```
alfred/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── models.py            # 数据模型
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── input_parser.py  # 输入解析
│   │   ├── signal_engine.py # 确定性信号计算
│   │   ├── prompt_builder.py# Prompt 构建
│   │   ├── llm_caller.py    # LLM 调用
│   │   ├── output_parser.py # 输出解析
│   │   └── decision_finalizer.py # 决策定稿与安全兜底
│   ├── scenarios.py         # 预置场景
│   └── config.py            # 配置
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ScenarioList.jsx
│   │   │   ├── DecisionInput.jsx
│   │   │   ├── DecisionResult.jsx
│   │   │   └── PipelineView.jsx
│   │   └── api.js
│   └── package.json
├── README.md
└── requirement.md
```
