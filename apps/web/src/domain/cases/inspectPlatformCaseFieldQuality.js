import { compactText } from "../../shared/text.js";

const qualityRules = [
  {
    fieldKey: "content_topic",
    label: "内容主题",
    minLength: 6,
  },
  {
    fieldKey: "content_goal_guess",
    label: "内容目标",
    minLength: 8,
  },
  {
    fieldKey: "link_or_asset_path",
    label: "来源链接或素材路径",
    validator: (value) => /^https?:\/\//u.test(value) || /[/.]/u.test(value),
    weakReason: "建议填写可追溯链接或明确素材路径",
  },
  {
    fieldKey: "subject_description",
    label: "主体描述",
    minLength: 8,
  },
  {
    fieldKey: "visual_focus",
    label: "视觉焦点",
    minLength: 6,
  },
  {
    fieldKey: "click_driver_primary",
    label: "主点击机制",
    minLength: 2,
  },
  {
    fieldKey: "direction_type_primary",
    label: "主封面方向",
    minLength: 2,
  },
  {
    fieldKey: "likely_positive_feedback",
    label: "正向反馈词",
    minLength: 6,
  },
  {
    fieldKey: "possible_adjustment_direction",
    label: "可能调整方向",
    minLength: 6,
  },
  {
    fieldKey: "one_sentence_summary",
    label: "一句话结论",
    minLength: 12,
  },
];

function looksPlaceholder(value) {
  return /^(待补|todo|tbd|待填|未填)/iu.test(value);
}

function inspectField(rule, parsedNote) {
  const rawValue = parsedNote[rule.fieldKey];
  const value = compactText(rawValue);

  if (!value) {
    return {
      fieldKey: rule.fieldKey,
      label: rule.label,
      status: "missing",
      issue: "缺失",
      value,
    };
  }

  if (looksPlaceholder(value)) {
    return {
      fieldKey: rule.fieldKey,
      label: rule.label,
      status: "weak",
      issue: "仍是占位词",
      value,
    };
  }

  if (rule.minLength && value.length < rule.minLength) {
    return {
      fieldKey: rule.fieldKey,
      label: rule.label,
      status: "weak",
      issue: `信息过短，建议至少 ${rule.minLength} 字`,
      value,
    };
  }

  if (rule.validator && !rule.validator(value)) {
    return {
      fieldKey: rule.fieldKey,
      label: rule.label,
      status: "weak",
      issue: rule.weakReason || "格式或信息不足",
      value,
    };
  }

  return {
    fieldKey: rule.fieldKey,
    label: rule.label,
    status: "usable",
    issue: "",
    value,
  };
}

export function inspectPlatformCaseFieldQuality({ platformCaseId, parsedNote }) {
  const checks = qualityRules.map((rule) => inspectField(rule, parsedNote));
  const missingFields = checks.filter((item) => item.status === "missing").map((item) => item.label);
  const weakFields = checks
    .filter((item) => item.status === "weak")
    .map((item) => `${item.label}（${item.issue}）`);
  const usableCount = checks.filter((item) => item.status === "usable").length;

  let status = "待回填";
  if (missingFields.length === 0 && weakFields.length === 0) {
    status = "可用于生成";
  } else if (usableCount >= 6) {
    status = "待补强";
  }

  return {
    platformCaseId,
    status,
    totalChecks: checks.length,
    usableCount,
    missingFields,
    weakFields,
    checks,
  };
}
