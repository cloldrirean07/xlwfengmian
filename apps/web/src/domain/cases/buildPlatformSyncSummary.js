import { compactText } from "../../shared/text.js";
import { inspectRealCaseReadiness } from "./inspectRealCaseReadiness.js";

const trackedFields = [
  ["contentTopic", "内容主题"],
  ["contentGoal", "内容目标"],
  ["assetDescription", "素材描述"],
  ["referencePreference", "封面偏好"],
  ["assetNotes", "素材备注"],
  ["evidence.sourceLink", "来源链接"],
  ["evidence.screenshotPath", "截图路径"],
  ["mockUserSelection.preserveElement", "保留项反馈"],
  ["mockUserSelection.feedback", "第二轮反馈"],
];

function getByPath(record, path) {
  return path.split(".").reduce((value, key) => value?.[key], record);
}

function changedValue(beforeValue, afterValue) {
  return compactText(beforeValue) !== compactText(afterValue);
}

export function buildPlatformSyncSummary(previousRecord, nextRecord) {
  const previousReadiness = inspectRealCaseReadiness(previousRecord);
  const nextReadiness = inspectRealCaseReadiness(nextRecord);
  const changedFields = trackedFields
    .filter(([path]) => changedValue(getByPath(previousRecord, path), getByPath(nextRecord, path)))
    .map(([, label]) => label);

  return {
    changedFields,
    readinessBefore: {
      status: previousReadiness.status,
      completedChecks: previousReadiness.completedChecks,
      totalChecks: previousReadiness.totalChecks,
      missingFields: previousReadiness.missingFields,
    },
    readinessAfter: {
      status: nextReadiness.status,
      completedChecks: nextReadiness.completedChecks,
      totalChecks: nextReadiness.totalChecks,
      missingFields: nextReadiness.missingFields,
    },
  };
}
