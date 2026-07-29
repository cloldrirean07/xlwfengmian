const priorityRules = {
  "来源链接或截图路径": {
    priority: "P0",
    score: 100,
    reason: "没有原始链接或截图，后续所有分析都缺少可回看的证据基础。",
  },
  "内容主题": {
    priority: "P0",
    score: 95,
    reason: "主题不明确，方向判断和案例归类都会失真。",
  },
  "素材描述": {
    priority: "P0",
    score: 90,
    reason: "不知道封面里具体有什么，就无法判断该保留还是该补图。",
  },
  "内容目标": {
    priority: "P1",
    score: 80,
    reason: "点开后要传达什么不清楚，会影响结果感和点击价值判断。",
  },
  "证据说明": {
    priority: "P1",
    score: 72,
    reason: "案例为什么值得纳入规则库，需要尽早说明，方便后续积累方法论。",
  },
  "素材备注": {
    priority: "P1",
    score: 68,
    reason: "素材限制条件会影响后续到底走现有素材优化还是补内容贴合图。",
  },
  "封面偏好": {
    priority: "P2",
    score: 58,
    reason: "偏好会影响优化方向，但不影响先完成客观案例事实。",
  },
  "保留项反馈": {
    priority: "P2",
    score: 52,
    reason: "这是第二轮优化输入，更适合在基础案例事实补齐后再写。",
  },
  "第二轮反馈": {
    priority: "P2",
    score: 50,
    reason: "第二轮反馈依赖前面的案例理解，优先级应略后。",
  },
};

export function rankRealCaseFillTasks(items) {
  return [...items]
    .map((item) => {
      const rule = priorityRules[item.label] || {
        priority: "P2",
        score: 40,
        reason: "建议在基础事实补齐后再处理这一项。",
      };

      return {
        ...item,
        priority: rule.priority,
        priorityScore: rule.score,
        priorityReason: rule.reason,
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));
}
