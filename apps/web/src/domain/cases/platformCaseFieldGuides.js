const fieldGuides = {
  "内容主题": {
    obsidianField: "0.基础信息 / content_topic",
    priority: "P0",
    score: 100,
    reason: "主题不明确，整条案例无法被准确归类，也无法判断封面到底在为哪类内容服务。",
    prompt: "用一句话写清这条内容具体讲什么，避免只写“干货”“知识分享”这种大词。",
    example: "例如：为什么你总觉得自己很忙但没结果。",
  },
  "来源链接或素材路径": {
    obsidianField: "0.基础信息 / link_or_asset_path",
    priority: "P0",
    score: 95,
    reason: "没有原始链接或截图路径，后续无法回看真实封面，也难以验证判断是否准确。",
    prompt: "补充真实发布链接，或至少补可追溯的截图路径。",
    example: "例如：https://www.douyin.com/... 或本地截图文件名。",
  },
  "主体描述": {
    obsidianField: "1.客观封面事实 / subject_description",
    priority: "P0",
    score: 90,
    reason: "不知道画面里具体有什么主体，就无法判断该保留什么、该补什么图。",
    prompt: "客观描述封面里出现的主体、动作、位置关系，不要直接写感受词。",
    example: "例如：人物半身口播截图，位于左侧，右侧留白较多。",
  },
  "内容目标": {
    obsidianField: "0.基础信息 / content_goal_guess",
    priority: "P1",
    score: 85,
    reason: "内容目标不清楚，会影响对‘结果感、损失感、好奇感’哪类点击机制更适配的判断。",
    prompt: "写清用户点开后最该得到什么，或作者最希望用户产生什么认知变化。",
    example: "例如：让用户意识到忙不等于有效产出。",
  },
  "视觉焦点": {
    obsidianField: "1.客观封面事实 / visual_focus",
    priority: "P1",
    score: 82,
    reason: "没有视觉焦点描述，就难以判断封面第一眼的注意力落点。",
    prompt: "写清用户第一眼最可能先看到什么，是大字、人物表情、物体还是色块冲突。",
    example: "例如：第一眼先看到右侧大字“忙但没结果”。",
  },
  "主点击机制": {
    obsidianField: "2.点击逻辑判断 / click_driver_primary",
    priority: "P1",
    score: 78,
    reason: "点击机制是规则映射的核心字段，不写会导致后续方向判断失去抓手。",
    prompt: "从风险损失、结果承诺、好奇悬念、反差冲突、信息清单里判断主机制。",
    example: "例如：风险损失型。",
  },
  "主封面方向": {
    obsidianField: "4.封面效果方向判断 / direction_type_primary",
    priority: "P1",
    score: 74,
    reason: "主方向不明确，后续很难把案例沉淀回你的 5 类封面体系。",
    prompt: "明确这条封面最像哪一种封面效果方向，并写成统一标签。",
    example: "例如：风险损失型。",
  },
  "正向反馈词": {
    obsidianField: "7.反馈词提炼 / likely_positive_feedback",
    priority: "P2",
    score: 64,
    reason: "正向反馈词决定后续如何保留有效特征，但前提是案例事实先补齐。",
    prompt: "写 1 到 2 条用户可能会认可这张封面的原因，偏感受化表达。",
    example: "例如：更抓眼、重点更明确。",
  },
  "可能调整方向": {
    obsidianField: "7.反馈词提炼 / possible_adjustment_direction",
    priority: "P2",
    score: 60,
    reason: "调整方向更适合在已经理解案例后再写，优先级略后。",
    prompt: "写一句自然语言，说明如果继续优化这张封面，最该改哪一点。",
    example: "例如：图更贴内容一点，别只靠大字。",
  },
  "一句话结论": {
    obsidianField: "9.案例结论 / one_sentence_summary",
    priority: "P2",
    score: 56,
    reason: "一句话结论适合在前面字段成形后再总结，否则容易流于空话。",
    prompt: "用一句话总结这条封面为什么能点，或为什么值得纳入规则库。",
    example: "例如：它用‘忙和没结果’的损失感对比，先抢点击再交代原因。",
  },
};

export function getPlatformCaseFieldGuide(label) {
  return fieldGuides[label] || null;
}

export function listPlatformCaseFieldGuides() {
  return fieldGuides;
}
