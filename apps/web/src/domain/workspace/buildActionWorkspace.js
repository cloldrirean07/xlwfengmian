import { buildActionWorkspaceInputSchema } from "./buildActionWorkspaceInputSchema.js";

const supportedWorkspaceIds = new Set(["optimize-current", "search-matched", "concept-first"]);

export function isSupportedWorkspaceId(workspaceId) {
  return supportedWorkspaceIds.has(workspaceId);
}

function resolveWorkspaceId(fields, primaryCard, requestedWorkspaceId = "") {
  if (isSupportedWorkspaceId(requestedWorkspaceId)) {
    return requestedWorkspaceId;
  }

  const topCandidateId = primaryCard?.rankedImageStrategies?.[0]?.candidateId || "";

  if (topCandidateId === "current-asset-optimize") {
    return "optimize-current";
  }

  if (topCandidateId === "content-matched-search") {
    return "search-matched";
  }

  if (topCandidateId === "creative-concept-asset") {
    return "concept-first";
  }

  return fields.primaryAssetActionId || "concept-first";
}

function resolveWorkspaceReason(fields, primaryCard) {
  return primaryCard?.primaryAssetActionReason || fields.primaryAssetActionReason;
}

function buildOptimizeCurrentWorkspace(fields, primaryCard) {
  return {
    workspaceId: "optimize-current",
    workspaceTitle: "优化现有素材",
    workspaceGoal: "先围绕当前已有的截图或基础画面，提炼出更能承担点击任务的主体、标题区和视觉主次。",
    whyNow: resolveWorkspaceReason(fields, primaryCard),
    nextSteps: [
      "先确认画面里第一眼最显眼的区域是不是内容真正的点击点。",
      "优先裁掉和主题无关、只会分散注意力的边角信息。",
      "让封面大字和主体形成明确主次，不要平均分配注意力。",
    ],
    checkpoints: [
      "第一眼焦点是否单一",
      "现有图里最值得保留的主体是否明确",
      "标题区是否压住了无关背景噪音",
    ],
    suggestedInputs: [
      "描述需要保留的主体区域",
      "描述需要裁掉或弱化的部分",
      "说明当前图最不满意的地方",
    ],
    inputSchema: buildActionWorkspaceInputSchema("optimize-current"),
    linkedCardDirection: primaryCard?.directionLabelUserFacing || "",
  };
}

function buildSearchMatchedWorkspace(fields, primaryCard) {
  return {
    workspaceId: "search-matched",
    workspaceTitle: "补内容贴合图",
    workspaceGoal: "先补一张更贴内容的辅助图，再决定标题区和构图，不急着直接做最终封面。",
    whyNow: resolveWorkspaceReason(fields, primaryCard),
    nextSteps: [
      "先把内容主题拆成一个最容易被看懂的主体或场景。",
      "优先找能直接解释主题的图，而不是只好看但不说事的图。",
      "找到图后再决定文字放哪一侧，避免先排版再硬找图。",
    ],
    checkpoints: [
      "补的图是否比当前图更贴内容",
      "新图是否更容易承载当前点击机制",
      "是否能明显降低“普通、太平、不贴内容”的问题",
    ],
    suggestedInputs: [
      "写出这条内容最适合出现的人物/物体/场景",
      "写出需要避免的图像风格",
      "写出补图后需要强化的点击点",
    ],
    inputSchema: buildActionWorkspaceInputSchema("search-matched"),
    linkedCardDirection: primaryCard?.directionLabelUserFacing || "",
  };
}

function buildConceptFirstWorkspace(fields, primaryCard) {
  return {
    workspaceId: "concept-first",
    workspaceTitle: "做创意概念图",
    workspaceGoal: "当前先不要被现成素材限制，先确定一个最能承载点击机制的概念主体，再回到封面执行。",
    whyNow: resolveWorkspaceReason(fields, primaryCard),
    nextSteps: [
      "先决定这条内容的主点击点更适合被哪个主体承载。",
      "先想单一主体和单一冲突，不要一开始堆太多元素。",
      "先把概念方向跑通，再决定要不要补真实图或走生图。",
    ],
    checkpoints: [
      "主体是否足够单一",
      "概念是否和内容真实相关",
      "是否比普通截图更有记忆点",
    ],
    suggestedInputs: [
      "写出第一眼需要呈现的主体",
      "写出主体需要传达的情绪或冲突",
      "写出需要避免的廉价感或营销号感",
    ],
    inputSchema: buildActionWorkspaceInputSchema("concept-first"),
    linkedCardDirection: primaryCard?.directionLabelUserFacing || "",
  };
}

export function buildActionWorkspace({ fields, primaryCard, workspaceId: requestedWorkspaceId = "" }) {
  const workspaceId = resolveWorkspaceId(fields, primaryCard, requestedWorkspaceId);

  if (workspaceId === "optimize-current") {
    return buildOptimizeCurrentWorkspace(fields, primaryCard);
  }

  if (workspaceId === "search-matched") {
    return buildSearchMatchedWorkspace(fields, primaryCard);
  }

  return buildConceptFirstWorkspace(fields, primaryCard);
}
