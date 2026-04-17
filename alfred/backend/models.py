from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class DecisionType(str, Enum):
    EXECUTE_SILENTLY = "EXECUTE_SILENTLY"
    EXECUTE_AND_TELL = "EXECUTE_AND_TELL"
    CONFIRM_FIRST = "CONFIRM_FIRST"
    ASK_CLARIFYING = "ASK_CLARIFYING"
    REFUSE_ESCALATE = "REFUSE_ESCALATE"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ActionType(str, Enum):
    SEND_EMAIL = "send_email"
    DRAFT_EMAIL = "draft_email"
    CREATE_CALENDAR = "create_calendar"
    DELETE_CALENDAR = "delete_calendar"
    SET_REMINDER = "set_reminder"
    DELETE_REMINDER = "delete_reminder"
    SCHEDULE_MEETING = "schedule_meeting"
    OTHER = "other"


class DecisionInput(BaseModel):
    action: str = Field(..., description="拟执行的动作描述")
    latest_message: str = Field(..., description="用户最新消息")
    conversation_history: list[str] = Field(default_factory=list, description="对话历史")
    user_state: dict = Field(default_factory=dict, description="用户状态")
    action_type: ActionType = Field(ActionType.OTHER, description="动作类型")
    model_id: Optional[str] = Field(None, description="使用的LLM模型ID")
    simulate_timeout: bool = Field(False, description="模拟LLM超时")
    simulate_malformed: bool = Field(False, description="模拟格式异常输出")


class SignalResult(BaseModel):
    action_risk_level: RiskLevel = RiskLevel.MEDIUM
    has_conversation_history: bool = False
    user_trust_level: str = "medium"
    is_irreversible: bool = False
    involves_external_party: bool = False
    has_explicit_confirmation: bool = False
    history_message_count: int = 0
    has_contradictory_signals: bool = False


class LLMOutput(BaseModel):
    decision: DecisionType = DecisionType.CONFIRM_FIRST
    confidence: float = 0.5
    intent_resolved: bool = False
    key_parameters: dict[str, bool] = Field(default_factory=dict)
    risk_assessment: RiskLevel = RiskLevel.MEDIUM
    rationale: str = ""


class PipelineTrace(BaseModel):
    inputs: dict = Field(default_factory=dict)
    signals: Optional[SignalResult] = None
    prompt: str = ""
    raw_llm_output: str = ""
    parsed_llm_output: Optional[LLMOutput] = None
    final_decision: DecisionType = DecisionType.CONFIRM_FIRST
    final_rationale: str = ""
    model_used: str = ""
    error: Optional[str] = None
    fallback_used: bool = False


class DecisionOutput(BaseModel):
    decision: DecisionType
    confidence: float
    rationale: str
    risk_assessment: RiskLevel
    intent_resolved: bool
    key_parameters: dict[str, bool]
    model_used: str
    fallback_used: bool
    pipeline_trace: PipelineTrace


class Scenario(BaseModel):
    id: int
    title: str
    category: str
    description: str
    input: DecisionInput
    expected_decision: DecisionType
    expected_rationale: str


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    available: bool
    api_key_env: str = ""
