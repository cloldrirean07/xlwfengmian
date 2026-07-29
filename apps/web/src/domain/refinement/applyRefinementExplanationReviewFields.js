const reviewFieldMap = {
  caseId: "review_case_id",
  reviewStatus: "review_status",
  explanationStatus: "explanation_status",
  misclassified: "misclassified",
  shouldExportToMisclassified: "should_export_to_misclassified",
  actualIssue: "actual_issue",
  suggestedKeyword: "suggested_keyword",
  suggestedMappingId: "suggested_mapping_id",
  suggestedPositiveSignalId: "suggested_positive_signal_id",
  fallbackAdjustment: "fallback_adjustment",
};

const reviewSectionStart = "## 2. 人工复核结论";
const reviewSectionEnd = "## 3. 规则调整建议";
const orderedReviewFields = Object.values(reviewFieldMap);

function getFieldLine(label, value) {
  const nextValue = value == null ? "" : String(value).trim();
  return `- ${label}: ${nextValue}`;
}

function replaceField(markdown, label, value) {
  return markdown.replace(
    new RegExp(`^-\\s+${label}:[ \\t]*[^\\n\\r]*$`, "m"),
    getFieldLine(label, value),
  );
}

function ensureFieldExists(markdown, label, value) {
  if (new RegExp(`^-\\s+${label}:[ \\t]*[^\\n\\r]*$`, "m").test(markdown)) {
    return replaceField(markdown, label, value);
  }

  const startIndex = markdown.indexOf(reviewSectionStart);
  const endIndex = markdown.indexOf(reviewSectionEnd);

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    return markdown;
  }

  const beforeSection = markdown.slice(0, startIndex);
  const sectionBlock = markdown.slice(startIndex, endIndex);
  const afterSection = markdown.slice(endIndex);
  const sectionLines = sectionBlock.split("\n");
  const fieldLine = getFieldLine(label, value);
  const labelIndex = orderedReviewFields.indexOf(label);

  let insertAt = sectionLines.length - 1;

  for (let index = labelIndex - 1; index >= 0; index -= 1) {
    const previousLabel = orderedReviewFields[index];
    const previousLineIndex = sectionLines.findIndex((line) =>
      line.startsWith(`- ${previousLabel}:`),
    );

    if (previousLineIndex >= 0) {
      insertAt = previousLineIndex + 1;
      break;
    }
  }

  sectionLines.splice(insertAt, 0, fieldLine);

  return `${beforeSection}${sectionLines.join("\n")}${afterSection}`;
}

export function applyRefinementExplanationReviewFields(markdown, reviewInput) {
  let nextMarkdown = markdown;

  for (const [inputKey, label] of Object.entries(reviewFieldMap)) {
    if (Object.hasOwn(reviewInput, inputKey)) {
      nextMarkdown = ensureFieldExists(nextMarkdown, label, reviewInput[inputKey]);
    }
  }

  return nextMarkdown;
}
