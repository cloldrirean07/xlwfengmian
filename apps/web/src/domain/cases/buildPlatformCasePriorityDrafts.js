function buildDraftText(task) {
  const drafts = {
    "内容主题": "这条内容主要在讲：[把具体主题写清，例如“为什么你总觉得自己很忙但没结果”]。",
    "来源链接或素材路径":
      "待补真实案例来源：[粘贴抖音链接 / 小红书链接 / 本地截图文件名]。",
    "主体描述":
      "封面主体初稿：画面中是[人物/物体/截图主体]，位于[左/中/右]，当前最显眼的是[大字/表情/动作/色块]。",
    "内容目标":
      "这条内容希望用户点开后获得：[一句话写清认知收获或结果感]。",
    "视觉焦点":
      "第一眼视觉焦点初稿：[写清用户最先看到的是大字、人物表情、动作，还是某个冲突画面]。",
    "主点击机制":
      "主点击机制初稿：[风险损失 / 结果承诺 / 好奇悬念 / 反差冲突 / 信息清单]。",
    "主封面方向":
      "主封面方向初稿：[从 5 类封面效果方向里选最接近的一类]。",
    "正向反馈词":
      "正向反馈词初稿：[例如 更抓眼 / 更明确 / 更像平台热门内容]。",
    "可能调整方向":
      "调整方向初稿：[一句话写清如果继续优化最该改哪里]。",
    "一句话结论":
      "一句话结论初稿：[总结这条封面为什么能点，控制在一句话内]。",
  };

  return drafts[task.label] || "[待补可编辑初稿]";
}

function buildEditHint(task) {
  const hints = {
    "内容主题": "避免写成“干货”“知识分享”这类泛词，尽量让别人一眼就知道内容具体讲什么。",
    "来源链接或素材路径": "这一项优先填真实链接，其次填可回看的截图路径，不要只写“手机相册里有”。",
    "主体描述": "这一项先写客观事实，不要提前下判断，例如不要直接写“很吸睛”。",
  };

  return hints[task.label] || "优先保持具体、可复核、可被别人理解。";
}

export function buildPlatformCasePriorityDrafts(review, limit = 3) {
  const topTasks = (review.actionPlan?.tasks || []).slice(0, limit);

  const cards = topTasks.map((task) => ({
    order: task.order,
    label: task.label,
    priority: task.priority,
    reason: task.reason,
    obsidianField: task.obsidianField,
    prompt: task.prompt,
    candidateText: task.candidateSuggestion?.text || "",
    candidateSource: task.candidateSuggestion?.source || "",
    draftText: buildDraftText(task),
    editHint: buildEditHint(task),
    example: task.example || "",
  }));

  return {
    totalCards: cards.length,
    cards,
  };
}
