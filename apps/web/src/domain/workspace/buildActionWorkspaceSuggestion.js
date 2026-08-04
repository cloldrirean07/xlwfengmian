import { compactText } from "../../shared/text.js";

function readValue(inputs, key) {
  return compactText(inputs?.[key]);
}

function buildOptimizeCurrentSuggestion({ analysis, workspace, inputs }) {
  const keepSubject = readValue(inputs, "keep_subject");
  const removeNoise = readValue(inputs, "remove_noise");
  const currentProblem = readValue(inputs, "current_problem");

  return {
    workspaceId: workspace.workspaceId,
    summary: "先围绕现有图提炼主体和标题区，比直接重做更快形成结果。",
    refinedTask: `优先保留「${keepSubject || "当前最能承担点击任务的主体"}」，并处理「${removeNoise || "背景噪音"}」这类分散注意力的问题。`,
    nextSuggestion: `先把「${currentProblem || "不够聚焦"}」作为唯一主问题处理，再观察封面大字和主体是否形成单焦点。`,
    riskChecks: [
      "不要一边想保留所有信息，一边又希望画面更聚焦。",
      "如果裁掉噪音后主体仍不成立，再考虑进入补图路径。",
    ],
    draftPromptLine: `请基于当前已有图片，保留 ${keepSubject || "主主体"}，弱化 ${removeNoise || "背景杂讯"}，优先解决 ${currentProblem || "画面不聚焦"}。`,
    recommendedFollowUp: "完成一次裁切和标题区重排后，再进入二轮反馈会更有效。",
    linkedDirection: workspace.linkedCardDirection || analysis.cards?.[0]?.directionLabelUserFacing,
  };
}

function buildSearchMatchedSuggestion({ analysis, workspace, inputs }) {
  const desiredSubject = readValue(inputs, "desired_subject");
  const avoidStyle = readValue(inputs, "avoid_style");
  const strengthenClickPoint = readValue(inputs, "strengthen_click_point");

  return {
    workspaceId: workspace.workspaceId,
    summary: "当前更适合先补一张贴内容的图，再决定最终排版。",
    refinedTask: `先围绕「${desiredSubject || "最贴内容的主体/场景"}」找图，并明确避免「${avoidStyle || "廉价素材感"}」。`,
    nextSuggestion: `补图时只围绕「${strengthenClickPoint || "当前最想强化的点击点"}」服务，不要同时追求太多气质。`,
    riskChecks: [
      "不要先定复杂版式再硬找图。",
      "如果找到的图只是好看但不贴内容，宁可继续收缩主体定义。",
    ],
    draftPromptLine: `请优先补一张能体现 ${desiredSubject || "主题主体"} 的图片，避免 ${avoidStyle || "廉价感"}，重点强化 ${strengthenClickPoint || "点击点"}。`,
    recommendedFollowUp: "补到候选图后，再回到方向卡选择文字摆放和构图。",
    linkedDirection: workspace.linkedCardDirection || analysis.cards?.[0]?.directionLabelUserFacing,
  };
}

function buildConceptFirstSuggestion({ analysis, workspace, inputs }) {
  const firstGlanceSubject = readValue(inputs, "first_glance_subject");
  const emotionOrConflict = readValue(inputs, "emotion_or_conflict");
  const avoidCheapness = readValue(inputs, "avoid_cheapness");

  return {
    workspaceId: workspace.workspaceId,
    summary: "当前更适合先把概念主体想准，再决定是否补真实图或走生图。",
    refinedTask: `先让用户第一眼看到「${firstGlanceSubject || "一个单一主体"}」，并让它承担「${emotionOrConflict || "核心冲突或情绪"}」。`,
    nextSuggestion: `概念阶段先避免「${avoidCheapness || "廉价营销号感"}」，只保留一个最强记忆点。`,
    riskChecks: [
      "不要一开始同时放多个主体和多个情绪。",
      "概念主体必须和内容真实相关，否则会变成空创意。",
    ],
    draftPromptLine: `请先构思一个主体为 ${firstGlanceSubject || "单一主体"} 的概念封面，重点体现 ${emotionOrConflict || "核心冲突"}，避免 ${avoidCheapness || "廉价感"}。`,
    recommendedFollowUp: "当概念主体稳定后，再决定是补真实图还是进入生成图方向。",
    linkedDirection: workspace.linkedCardDirection || analysis.cards?.[0]?.directionLabelUserFacing,
  };
}

export function buildActionWorkspaceSuggestion({ analysis, workspace, inputs }) {
  if (workspace.workspaceId === "optimize-current") {
    return buildOptimizeCurrentSuggestion({ analysis, workspace, inputs });
  }

  if (workspace.workspaceId === "search-matched") {
    return buildSearchMatchedSuggestion({ analysis, workspace, inputs });
  }

  return buildConceptFirstSuggestion({ analysis, workspace, inputs });
}
