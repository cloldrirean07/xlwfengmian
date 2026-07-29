import { compactText } from "../../shared/text.js";

const requiredFields = [
  ["case_id", "案例编号"],
  ["source_platform", "来源平台"],
  ["content_topic", "内容主题"],
  ["content_goal_guess", "内容目标"],
  ["link_or_asset_path", "来源链接或素材路径"],
  ["subject_description", "主体描述"],
  ["visual_focus", "视觉焦点"],
  ["click_driver_primary", "主点击机制"],
  ["direction_type_primary", "主封面方向"],
  ["likely_positive_feedback", "正向反馈词"],
  ["possible_adjustment_direction", "可能调整方向"],
  ["one_sentence_summary", "一句话结论"],
];

function isFilled(value) {
  const normalized = compactText(value);
  return Boolean(normalized);
}

export function inspectPlatformCaseCompleteness({ platformCaseId, parsedNote }) {
  const checks = requiredFields.map(([fieldKey, label]) => ({
    fieldKey,
    label,
    complete: isFilled(parsedNote[fieldKey]),
  }));

  const missingFields = checks.filter((item) => !item.complete).map((item) => item.label);
  const completedChecks = checks.length - missingFields.length;

  let status = "待回填";
  if (missingFields.length === 0) {
    status = "可进入同步";
  } else if (completedChecks >= 6) {
    status = "部分回填";
  }

  return {
    platformCaseId,
    status,
    totalChecks: checks.length,
    completedChecks,
    missingFields,
    checks,
  };
}
