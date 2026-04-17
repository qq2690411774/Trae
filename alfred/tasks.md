# alfred_ Execution Decision Layer — 任务步骤

## 阶段一：后端核心开发

### Task 1.1: 项目初始化与数据模型
- 创建 `backend/` 目录结构
- 定义 Pydantic 数据模型：`DecisionInput`, `DecisionOutput`, `SignalResult`, `PipelineTrace`
- 配置 FastAPI 应用入口 `main.py`
- 配置 CORS、环境变量管理 `config.py`

### Task 1.2: 确定性信号引擎
- 实现 `signal_engine.py`
- 动作风险映射表（action_type → risk_level, is_irreversible, involves_external）
- 确认词检测（"yes", "yep", "send it", "确认", "发吧" 等）
- 对话历史分析信号（消息数量、是否有矛盾指令）
- 用户信任等级读取

### Task 1.3: Prompt 构建器
- 实现 `prompt_builder.py`
- 结构化 Prompt 模板（System + User 部分）
- 动态注入确定性信号到 Prompt
- 对话历史格式化

### Task 1.4: LLM 调用层
- 实现 `llm_caller.py`
- OpenAI API 集成（GPT-4o-mini）
- 超时控制（默认 10s）
- 重试机制（1 次）
- 错误捕获与异常类型定义

### Task 1.5: 输出解析器
- 实现 `output_parser.py`
- JSON 输出解析与验证
- 异常格式修复尝试（截取 JSON 部分）
- 解析失败时的降级处理

### Task 1.6: 决策定稿与安全兜底
- 实现 `decision_finalizer.py`
- 安全兜底规则引擎
- LLM 决策与确定性规则的合并逻辑
- 不可逆动作的强制确认覆盖

### Task 1.7: 决策管线编排
- 实现 Pipeline 编排逻辑
- 串联：Input Parser → Signal Engine → Prompt Builder → LLM Caller → Output Parser → Decision Finalizer
- 生成完整的 `PipelineTrace` 对象（记录每一步的输入输出）

### Task 1.8: API 端点
- `POST /api/decision` — 提交决策请求
- `GET /api/scenarios` — 获取预置场景列表
- `POST /api/decision/scenario/{id}` — 执行指定预置场景
- `GET /api/health` — 健康检查

### Task 1.9: 预置场景
- 实现 `scenarios.py`
- 6 个预置场景（2 简单 + 2 模糊 + 2 风险）
- 每个场景包含完整的输入数据和预期决策说明

---

## 阶段二：前端开发

### Task 2.1: 前端项目初始化
- 使用 Vite + React 初始化项目
- 安装依赖（axios 等）
- 配置 API 代理

### Task 2.2: 场景选择器组件
- `ScenarioList.jsx` — 预置场景列表
- 点击场景自动填充输入并触发决策
- 场景分类标签（简单/模糊/风险）

### Task 2.3: 决策输入组件
- `DecisionInput.jsx` — 自定义输入表单
- Action、Latest Message、Conversation History 输入
- 提交按钮与加载状态

### Task 2.4: 决策结果组件
- `DecisionResult.jsx` — 决策结果卡片
- 显示决策类型、置信度、理由
- 不同决策类型的颜色/图标区分

### Task 2.5: 管线视图组件
- `PipelineView.jsx` — 完整管线展示
- 分步展示：Inputs → Signals → Prompt → Raw Output → Final Decision
- 可折叠/展开每一步的详细内容

### Task 2.6: 失败状态展示
- 超时警告标识
- 解析失败提示
- 兜底决策说明

---

## 阶段三：集成与测试

### Task 3.1: 前后端联调
- 启动后端服务
- 启动前端开发服务器
- 验证所有 API 端点正常

### Task 3.2: 场景验证
- 逐一验证 6 个预置场景的决策结果
- 确认管线视图数据完整

### Task 3.3: 失败路径测试
- 模拟 LLM 超时
- 模拟格式异常输出
- 模拟缺失上下文

### Task 3.4: README 编写
- 信号系统说明
- LLM 与代码职责划分
- Prompt 设计说明
- 失败模式说明
- 系统演进方向
- 未来 6 个月规划

---

## 执行顺序

```
Task 1.1 → Task 1.2 → Task 1.3 → Task 1.4 → Task 1.5 → Task 1.6 → Task 1.7 → Task 1.8 → Task 1.9
                                                                                              ↓
Task 2.1 → Task 2.2 → Task 2.3 → Task 2.4 → Task 2.5 → Task 2.6 ──────────────────────→ Task 3.1
                                                                                              ↓
                                                                              Task 3.2 → Task 3.3 → Task 3.4
```
