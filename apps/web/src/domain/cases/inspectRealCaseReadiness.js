import { compactText } from "../../shared/text.js";

function isPlaceholderText(value) {
  const normalized = compactText(value);
  return !normalized || normalized.startsWith("待补");
}

function buildCheck(label, value) {
  return {
    label,
    complete: !isPlaceholderText(value),
  };
}

export function inspectRealCaseReadiness(record) {
  const checks = [
    buildCheck("内容主题", record.contentTopic),
    buildCheck("内容目标", record.contentGoal),
    buildCheck("素材描述", record.assetDescription),
    buildCheck("封面偏好", record.referencePreference),
    buildCheck("素材备注", record.assetNotes),
    buildCheck("证据说明", record.evidence?.notes),
    buildCheck("保留项反馈", record.mockUserSelection?.preserveElement),
    buildCheck("第二轮反馈", record.mockUserSelection?.feedback),
  ];

  const sourceReferenceReady =
    !isPlaceholderText(record.evidence?.sourceLink) || !isPlaceholderText(record.evidence?.screenshotPath);

  checks.push({
    label: "来源链接或截图路径",
    complete: sourceReferenceReady,
  });

  const missingFields = checks.filter((item) => !item.complete).map((item) => item.label);
  const completedCount = checks.length - missingFields.length;

  let status = "待回填";
  if (missingFields.length === 0) {
    status = "可进入手动验证";
  } else if (completedCount >= 4) {
    status = "部分回填";
  }

  return {
    caseId: record.id,
    title: record.title,
    platformCaseId: record.tracking?.platformCaseId || "",
    status,
    totalChecks: checks.length,
    completedChecks: completedCount,
    missingFields,
    checks,
  };
}
