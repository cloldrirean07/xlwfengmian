import { compactText } from "../../shared/text.js";

function isPlaceholder(value) {
  const normalized = compactText(value);
  if (!normalized) {
    return true;
  }

  return /^(待补|todo|tbd|待填|未填)/iu.test(normalized);
}

function resolveSourceValue(review, fieldKey) {
  const noteValue = review.parsedNote?.[fieldKey];
  if (!isPlaceholder(noteValue)) {
    return compactText(noteValue);
  }

  const preview = review.syncPreview?.preview || {};

  switch (fieldKey) {
    case "content_topic":
      return isPlaceholder(preview.contentTopic) ? "" : compactText(preview.contentTopic);
    case "content_goal_guess":
      return isPlaceholder(preview.contentGoal) ? "" : compactText(preview.contentGoal);
    case "subject_description":
      return isPlaceholder(preview.assetDescription) ? "" : compactText(preview.assetDescription);
    case "likely_positive_feedback":
      return isPlaceholder(preview.referencePreference)
        ? ""
        : compactText(preview.referencePreference);
    case "possible_adjustment_direction":
      return isPlaceholder(preview.mockUserSelection?.feedback)
        ? ""
        : compactText(preview.mockUserSelection?.feedback);
    case "link_or_asset_path":
      if (!isPlaceholder(preview.evidence?.sourceLink)) {
        return compactText(preview.evidence?.sourceLink);
      }
      if (!isPlaceholder(preview.evidence?.screenshotPath)) {
        return compactText(preview.evidence?.screenshotPath);
      }
      return "";
    default:
      return "";
  }
}

function buildSuggestion(task, review) {
  const platform = review.linkedCases?.[0]?.platform || review.parsedNote?.source_platform || "当前平台";
  const fromSource = {
    "内容主题": resolveSourceValue(review, "content_topic"),
    "内容目标": resolveSourceValue(review, "content_goal_guess"),
    "来源链接或素材路径": resolveSourceValue(review, "link_or_asset_path"),
    "主体描述": resolveSourceValue(review, "subject_description"),
    "正向反馈词": resolveSourceValue(review, "likely_positive_feedback"),
    "可能调整方向": resolveSourceValue(review, "possible_adjustment_direction"),
  }[task.label];

  if (fromSource) {
    return {
      label: task.label,
      status: "candidate",
      source: "已有结构化信息",
      text: fromSource,
    };
  }

  const fallbackMap = {
    "内容主题": `待人工确认：把这条${platform}内容具体讲什么写成一句话主题。`,
    "内容目标": "待人工确认：写清用户点开后最该得到什么认知或收获。",
    "来源链接或素材路径": `待人工确认：补真实${platform}链接，或补可回看的截图路径。`,
    "主体描述": "待人工确认：客观描述封面主体、位置、动作与留白关系。",
    "视觉焦点": "待人工确认：写清用户第一眼先看到的是大字、人物还是冲突画面。",
    "主点击机制": "待人工确认：从风险损失 / 结果承诺 / 好奇悬念 / 反差冲突 / 信息清单中选主机制。",
    "主封面方向": "待人工确认：从 5 类封面效果方向里选最接近的一类。",
    "正向反馈词": "待人工确认：写 1 到 2 个用户可能会认可的点，比如更抓眼、重点更明确。",
    "可能调整方向": "待人工确认：写一句如果继续优化最该改什么。",
    "一句话结论": "待人工确认：总结这条封面为什么能点，控制在一句话内。",
  };

  return {
    label: task.label,
    status: "needs_manual_input",
    source: "规则提示",
    text: fallbackMap[task.label] || "待人工确认：按字段要求补全。",
  };
}

export function buildPlatformCaseCandidateSuggestions(review) {
  const tasks = (review.actionPlan?.tasks || []).map((task) => ({
    order: task.order,
    label: task.label,
    priority: task.priority,
    suggestion: buildSuggestion(task, review),
  }));

  return {
    totalSuggestions: tasks.length,
    readyCandidates: tasks.filter((item) => item.suggestion.status === "candidate").length,
    tasks,
  };
}
