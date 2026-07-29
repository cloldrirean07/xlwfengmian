const fieldMap = {
  "目标批次": "targetBatchLabel",
  "目标记录": "targetPath",
  "当前改写来源": "patchSourceLabel",
  "当前 patch 来源": "patchSourceLabel",
  "人工复盘结论": "manualReviewConclusion",
  "哪几行确认可以正式写回": "confirmedLines",
  "哪几行你确认可以正式写回": "confirmedLines",
  "哪几行仍需手改": "stillNeedsEdit",
  "是否已经可以进入正式写回": "readyDecision",
};

export function validateManualReviewConclusion(value = "") {
  const conclusion = String(value || "").trim();

  if (!conclusion) {
    return {
      ok: false,
      message: "请输入人工复盘结论",
    };
  }

  if (conclusion.length > 500) {
    return {
      ok: false,
      message: "人工复盘结论最多输入 500 个字符",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

function normalizeFieldLabel(label = "") {
  return label.replace(/^[\-\s]+/u, "").replace(/：$/u, "").trim();
}

function isReadyDecision(value = "") {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return false;
  }

  return /^(是|可以|可进入|ready|yes)/iu.test(normalized);
}

function extractMarkerSection(markdown = "", startMarker = "", endMarker = "") {
  if (!startMarker || !endMarker) {
    return "";
  }

  const startIndex = markdown.indexOf(startMarker);
  const endIndex = markdown.indexOf(endMarker);

  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
    return "";
  }

  return markdown
    .slice(startIndex + startMarker.length, endIndex)
    .replace(/^\n+/u, "")
    .replace(/\n+$/u, "")
    .trim();
}

function extractHeadingSection(markdown = "", heading = "", fallbackEndHeading = "") {
  if (!heading) {
    return "";
  }

  const startIndex = markdown.indexOf(heading);

  if (startIndex < 0) {
    return "";
  }

  const sectionStart = startIndex + heading.length;
  const searchSpace = markdown.slice(sectionStart);
  const fallbackIndex = fallbackEndHeading ? searchSpace.indexOf(fallbackEndHeading) : -1;
  const genericNextHeadingIndex = searchSpace.search(/\n##\s+/u);
  let sectionEnd = markdown.length;

  if (fallbackIndex >= 0) {
    sectionEnd = sectionStart + fallbackIndex;
  } else if (genericNextHeadingIndex >= 0) {
    sectionEnd = sectionStart + genericNextHeadingIndex;
  }

  return markdown
    .slice(sectionStart, sectionEnd)
    .replace(/^\s*\n/u, "")
    .replace(/\n+\s*$/u, "")
    .trim();
}

function extractListFieldValue(markdown = "", targetLabel = "") {
  const lines = String(markdown || "").split("\n");
  const collected = [];
  let isCollecting = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (isCollecting) {
      if (trimmed.startsWith("## ")) {
        break;
      }

      const separatorIndex = trimmed.indexOf("：");

      if (trimmed.startsWith("- ") && separatorIndex >= 0) {
        break;
      }

      collected.push(rawLine.replace(/^\s{0,2}/u, ""));
      continue;
    }

    if (!trimmed.startsWith("- ")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("：");

    if (separatorIndex < 0) {
      continue;
    }

    const label = normalizeFieldLabel(trimmed.slice(0, separatorIndex));

    if (label !== targetLabel) {
      continue;
    }

    isCollecting = true;
    collected.push(trimmed.slice(separatorIndex + 1).trim());
  }

  return collected.join("\n").trim();
}

export function parseBatchReviewManualSafeWritePreviewNote(markdown = "") {
  const parsed = {};
  const normalizedMarkdown = String(markdown || "");
  const lines = normalizedMarkdown.split("\n");

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("- ")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("：");
    if (separatorIndex < 0) {
      continue;
    }

    const label = normalizeFieldLabel(trimmed.slice(0, separatorIndex));
    const value = trimmed.slice(separatorIndex + 1).trim();
    const fieldKey = fieldMap[label];

    if (!fieldKey) {
      continue;
    }

    parsed[fieldKey] = value;
  }

  const confirmedLines = String(parsed.confirmedLines || "").trim();
  const stillNeedsEdit = String(parsed.stillNeedsEdit || "").trim();
  const readyDecision = String(parsed.readyDecision || "").trim();
  const manualReviewConclusion = extractListFieldValue(
    normalizedMarkdown,
    "人工复盘结论",
  ) || String(parsed.manualReviewConclusion || "").trim();
  const manualReviewConclusionValidation = validateManualReviewConclusion(manualReviewConclusion);
  const currentMarkdown =
    extractMarkerSection(
      normalizedMarkdown,
      "<!-- SAFE_WRITE_CURRENT_START -->",
      "<!-- SAFE_WRITE_CURRENT_END -->",
    ) ||
    extractHeadingSection(normalizedMarkdown, "## 2. 当前记录原文", "## 3. 写回后预览");
  const patchedMarkdown =
    extractMarkerSection(
      normalizedMarkdown,
      "<!-- SAFE_WRITE_PATCHED_START -->",
      "<!-- SAFE_WRITE_PATCHED_END -->",
    ) ||
    extractHeadingSection(normalizedMarkdown, "## 3. 写回后预览", "## 2. 人工补充");

  return {
    parsed,
    targetBatchLabel: parsed.targetBatchLabel || "",
    targetPath: parsed.targetPath || "",
    patchSourceLabel: parsed.patchSourceLabel || "",
    manualReviewConclusion,
    manualReviewConclusionValidation,
    currentMarkdown,
    patchedMarkdown,
    hasManualConfirmation:
      manualReviewConclusion.length > 0 ||
      confirmedLines.length > 0 ||
      stillNeedsEdit.length > 0 ||
      readyDecision.length > 0,
    canProceedToFormalWrite:
      manualReviewConclusionValidation.ok && isReadyDecision(readyDecision) && !stillNeedsEdit,
  };
}
