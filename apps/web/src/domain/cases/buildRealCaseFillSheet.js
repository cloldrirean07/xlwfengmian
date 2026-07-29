import { rankRealCaseFillTasks } from "./rankRealCaseFillTasks.js";

const fieldGuides = {
  "内容主题": {
    codeField: "contentTopic",
    obsidianField: "0.基础信息 / content_topic",
    prompt: "用一句话写清这条内容到底在讲什么，不要写成很泛的大主题。",
  },
  "内容目标": {
    codeField: "contentGoal",
    obsidianField: "0.基础信息 / content_goal_guess",
    prompt: "写清用户点开后最该得到什么，或者作者最想传达什么价值。",
  },
  "素材描述": {
    codeField: "assetDescription",
    obsidianField: "1.客观封面事实 / subject_description + visual_focus",
    prompt: "描述当前封面/截图里真正出现了什么主体、画面位置和可用视觉线索。",
  },
  "封面偏好": {
    codeField: "referencePreference",
    obsidianField: "7.反馈词提炼 / likely_positive_feedback",
    prompt: "写清如果要继续优化这条封面，你更希望往什么感觉靠近。",
  },
  "素材备注": {
    codeField: "assetNotes",
    obsidianField: "3.素材与视觉支撑判断",
    prompt: "补充现有素材的限制条件，比如普通、太远、不够贴内容、质感一般。",
  },
  "证据说明": {
    codeField: "evidence.notes",
    obsidianField: "8.产品规则库转译 / why_it_strengthens",
    prompt: "说明为什么这条案例值得纳入规则库，它体现了什么可复用经验。",
  },
  "保留项反馈": {
    codeField: "mockUserSelection.preserveElement",
    obsidianField: "7.反馈词提炼 / likely_positive_feedback",
    prompt: "假设用户会先认可这张封面的哪一部分，写一条要保留的强项。",
  },
  "第二轮反馈": {
    codeField: "mockUserSelection.feedback",
    obsidianField: "7.反馈词提炼 / possible_adjustment_direction",
    prompt: "假设用户给一句优化反馈，写一条自然语言的修改意见。",
  },
  "来源链接或截图路径": {
    codeField: "evidence.sourceLink / evidence.screenshotPath",
    obsidianField: "0.基础信息 / link_or_asset_path",
    prompt: "补真实链接或截图路径，至少提供一项能回看原始案例的证据。",
  },
};

export function buildRealCaseFillSheet({ record, readiness }) {
  const rawMissingItems = readiness.missingFields.map((label, index) => {
    const guide = fieldGuides[label];

    return {
      order: index + 1,
      label,
      codeField: guide?.codeField || "",
      obsidianField: guide?.obsidianField || "",
      prompt: guide?.prompt || "补全该字段，并保持与 Obsidian 案例记录一致。",
    };
  });
  const missingItems = rankRealCaseFillTasks(rawMissingItems);
  const topPriorityItems = missingItems.filter((item) => item.priority === "P0").slice(0, 3);

  return {
    caseId: record.id,
    title: record.title,
    platform: record.platform,
    platformCaseId: record.tracking?.platformCaseId || "",
    obsidianCasePath: record.tracking?.obsidianCasePath || "",
    readinessStatus: readiness.status,
    missingCount: missingItems.length,
    topPriorityItems,
    missingItems,
  };
}
