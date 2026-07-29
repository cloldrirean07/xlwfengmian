import { compactText } from "../../shared/text.js";

export function buildRealCaseTemplate({
  id,
  title,
  platform = "抖音",
  platformCaseId,
  obsidianCasePath,
  sourceLink = "",
  screenshotPath = "",
  keyCaseRerunPriority = 1,
  maintenanceTags = ["real-case", "待确认是否纳入关键复跑"],
}) {
  const normalizedId = compactText(id);
  const normalizedTitle = compactText(title) || `待补真实案例 ${normalizedId}`;
  const normalizedPlatform = compactText(platform) || "抖音";

  if (!normalizedId) {
    throw new Error('Real case scaffold requires "id".');
  }

  if (!compactText(platformCaseId)) {
    throw new Error('Real case scaffold requires "platformCaseId".');
  }

  if (!compactText(obsidianCasePath)) {
    throw new Error('Real case scaffold requires "obsidianCasePath".');
  }

  return {
    id: normalizedId,
    title: normalizedTitle,
    sourceType: "real",
    platform: normalizedPlatform,
    tracking: {
      platformCaseId: compactText(platformCaseId),
      obsidianCasePath: compactText(obsidianCasePath),
    },
    contentTopic: "待补真实内容主题",
    contentGoal: "待补这条内容想传达的价值或点击目标",
    userAssetType: "截图",
    assetDescription: "待补当前已有截图/画面/用户想法，以及希望补什么类型的图",
    referencePreference: "待补希望的封面风格和质感倾向",
    assetNotes: "待补当前素材状态、画面特点、限制条件",
    operations: {
      keyCaseRerunPriority: Number.isFinite(Number(keyCaseRerunPriority))
        ? Number(keyCaseRerunPriority)
        : 1,
      maintenanceTags: Array.isArray(maintenanceTags)
        ? maintenanceTags.map((item) => compactText(item)).filter(Boolean)
        : ["real-case", "待确认是否纳入关键复跑"],
    },
    evidence: {
      sourceLink: compactText(sourceLink),
      screenshotPath: compactText(screenshotPath),
      notes: "待补为什么这条真实案例值得被纳入代码层样例",
    },
    mockUserSelection: {
      selectedCardId: "B",
      preserveElement: "待补希望保留的点击钩子或视觉元素",
      feedback: "待补第二轮优化反馈",
    },
  };
}
