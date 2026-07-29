import { variableToUserLabel } from "./feedbackMappings.js";

const preserveSourceLabels = {
  field: "保留项字段",
  feedback: "一句反馈",
  fallback: "已选方向",
};

function formatMatchedKeywords(keywords) {
  if (!keywords || keywords.length === 0) {
    return ["未命中明确关键词，使用默认规则兜底。"];
  }

  return [`命中关键词：${keywords.join(" / ")}`];
}

export function buildFeedbackMappingExplanation({ adjustment, ruleMeta }) {
  const lines = [
    `负向问题映射到「${adjustment.feedbackMappedIssuePrimary}」`,
    `这轮主改变量是「${variableToUserLabel[adjustment.feedbackTargetVariable] || adjustment.feedbackTargetVariable}」`,
    `辅助变量参考「${variableToUserLabel[adjustment.feedbackSupportVariable] || adjustment.feedbackSupportVariable}」`,
    `修改请求识别为：${adjustment.changeRequest || adjustment.feedbackAction}`,
    `保留项来自「${preserveSourceLabels[adjustment.preserveElementSource] || "已选方向"}」：${adjustment.preserveElement}`,
    `保留信号优先保住「${variableToUserLabel[adjustment.preservedVariable] || adjustment.preservedVariable}」`,
    ...formatMatchedKeywords(adjustment.feedbackMatchedKeywords),
  ];

  if (adjustment.workspaceContext?.summary) {
    lines.push(`已接入工作区上下文：${adjustment.workspaceContext.summary}`);
  }

  return {
    ruleVersion: ruleMeta?.version || "unknown",
    negativeMappingId: adjustment.feedbackMappingId,
    positiveMappingId: adjustment.feedbackPositiveMappingId || null,
    negativeIssue: adjustment.feedbackMappedIssuePrimary,
    targetVariableLabel:
      variableToUserLabel[adjustment.feedbackTargetVariable] || adjustment.feedbackTargetVariable,
    supportVariableLabel:
      variableToUserLabel[adjustment.feedbackSupportVariable] || adjustment.feedbackSupportVariable,
    preservedVariableLabel:
      variableToUserLabel[adjustment.preservedVariable] || adjustment.preservedVariable,
    preservedSignal: adjustment.feedbackPreservedSignal,
    matchedKeywords: adjustment.feedbackMatchedKeywords,
    usedFallback: adjustment.feedbackUsedFallback,
    workspaceInjected: Boolean(adjustment.workspaceContext),
    summary: `规则 ${ruleMeta?.version || "unknown"} 将当前反馈归因为「${adjustment.feedbackMappedIssuePrimary}」，因此优先把方向往「${variableToUserLabel[adjustment.feedbackTargetVariable] || adjustment.feedbackTargetVariable}」修正。`,
    explanationLines: lines,
  };
}
