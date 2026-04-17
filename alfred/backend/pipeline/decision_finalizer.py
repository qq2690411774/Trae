from models import LLMOutput, SignalResult, DecisionType, RiskLevel, PipelineTrace


def _is_risky_action_for_refuse(signals: SignalResult, action_text: str) -> bool:
    lower = action_text.lower()
    batch_delete_keywords = ["delete all", "remove all", "clear all", "delete every", "全删", "全部删除", "清空"]
    for kw in batch_delete_keywords:
        if kw in lower:
            return True
    competitor_keywords = ["competitor", "rival", "competiting", "竞争对手", "竞对"]
    sensitive_keywords = ["contract", "confidential", "proprietary", "合同", "机密", "敏感"]
    has_competitor = any(kw in lower for kw in competitor_keywords)
    has_sensitive = any(kw in lower for kw in sensitive_keywords)
    if has_competitor and has_sensitive:
        return True
    return False


def finalize_decision(
    llm_output: LLMOutput,
    signals: SignalResult,
    trace: PipelineTrace,
) -> PipelineTrace:
    final_decision = llm_output.decision
    final_rationale = llm_output.rationale
    fallback_used = trace.fallback_used

    action_text = trace.inputs.get("action", "") if trace.inputs else ""
    latest_message = trace.inputs.get("latest_message", "") if trace.inputs else ""

    if not llm_output.intent_resolved and final_decision == DecisionType.EXECUTE_SILENTLY:
        final_decision = DecisionType.ASK_CLARIFYING
        final_rationale = "Intent or key parameters are not resolved. " + final_rationale

    if _is_risky_action_for_refuse(signals, action_text):
        if final_decision in (DecisionType.EXECUTE_SILENTLY, DecisionType.EXECUTE_AND_TELL, DecisionType.CONFIRM_FIRST):
            final_decision = DecisionType.REFUSE_ESCALATE
            final_rationale = "Action poses severe risk (batch deletion or sensitive data to competitor). Escalating. " + final_rationale

    if signals.is_irreversible and signals.involves_external_party:
        if final_decision == DecisionType.EXECUTE_SILENTLY:
            final_decision = DecisionType.CONFIRM_FIRST
            final_rationale = "Irreversible action involving external party requires confirmation. " + final_rationale

    if signals.is_irreversible and not signals.has_explicit_confirmation:
        if final_decision == DecisionType.EXECUTE_SILENTLY:
            final_decision = DecisionType.CONFIRM_FIRST
            final_rationale = "Irreversible action without explicit user confirmation requires confirmation. " + final_rationale

    if signals.has_contradictory_signals:
        if final_decision in (DecisionType.EXECUTE_SILENTLY, DecisionType.EXECUTE_AND_TELL):
            final_decision = DecisionType.CONFIRM_FIRST
            final_rationale = "Contradictory signals in conversation history require confirmation. " + final_rationale

    if trace.error:
        if _is_risky_action_for_refuse(signals, action_text):
            final_decision = DecisionType.REFUSE_ESCALATE
            final_rationale = f"LLM unavailable (fallback): {trace.error}. High-risk action detected, escalating for safety. " + final_rationale
        elif not latest_message.strip() or not action_text.strip():
            final_decision = DecisionType.ASK_CLARIFYING
            final_rationale = f"LLM unavailable (fallback): {trace.error}. Critical context missing, asking for clarification. " + final_rationale
        elif signals.action_risk_level == RiskLevel.HIGH and not signals.has_explicit_confirmation:
            final_decision = DecisionType.ASK_CLARIFYING
            final_rationale = f"LLM unavailable (fallback): {trace.error}. High risk action without explicit confirmation, asking for clarification. " + final_rationale
        elif signals.action_risk_level == RiskLevel.LOW and not signals.is_irreversible:
            if signals.has_explicit_confirmation:
                final_decision = DecisionType.EXECUTE_AND_TELL
                final_rationale = f"LLM unavailable (fallback): {trace.error}. Low risk action with user confirmation, execute and notify. " + final_rationale
            else:
                final_decision = DecisionType.EXECUTE_SILENTLY
                final_rationale = f"LLM unavailable (fallback): {trace.error}. Low risk reversible action, executing silently. " + final_rationale
        elif signals.action_risk_level == RiskLevel.LOW and signals.is_irreversible and signals.has_explicit_confirmation:
            final_decision = DecisionType.EXECUTE_AND_TELL
            final_rationale = f"LLM unavailable (fallback): {trace.error}. Low risk irreversible action with confirmation, execute and notify. " + final_rationale
        elif signals.action_risk_level == RiskLevel.MEDIUM and not signals.is_irreversible and signals.has_explicit_confirmation:
            final_decision = DecisionType.EXECUTE_AND_TELL
            final_rationale = f"LLM unavailable (fallback): {trace.error}. Medium risk reversible action with confirmation, execute and notify. " + final_rationale
        elif signals.action_risk_level == RiskLevel.MEDIUM and not signals.is_irreversible and not signals.involves_external_party:
            final_decision = DecisionType.EXECUTE_AND_TELL
            final_rationale = f"LLM unavailable (fallback): {trace.error}. Medium risk reversible action without external parties, execute and notify. " + final_rationale
        elif signals.action_risk_level == RiskLevel.MEDIUM and not signals.is_irreversible and signals.involves_external_party:
            final_decision = DecisionType.EXECUTE_AND_TELL
            final_rationale = f"LLM unavailable (fallback): {trace.error}. Medium risk reversible action involving others, execute and notify. " + final_rationale
        else:
            final_decision = DecisionType.CONFIRM_FIRST
            final_rationale = f"LLM unavailable (fallback): {trace.error}. Defaulting to CONFIRM_FIRST for safety. " + final_rationale
        fallback_used = True

    if not final_rationale.strip():
        final_rationale = "Decision made based on deterministic rules and LLM analysis."

    trace.final_decision = final_decision
    trace.final_rationale = final_rationale
    trace.fallback_used = fallback_used

    return trace
