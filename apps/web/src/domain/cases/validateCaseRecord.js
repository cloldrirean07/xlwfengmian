import { compactText } from "../../shared/text.js";

const allowedSourceTypes = new Set(["sample", "real"]);

function requireText(value, fieldName) {
  const normalized = compactText(value);

  if (!normalized) {
    throw new Error(`Case field "${fieldName}" is required.`);
  }

  return normalized;
}

function normalizeMockUserSelection(selection) {
  if (!selection || typeof selection !== "object") {
    throw new Error('Case field "mockUserSelection" is required.');
  }

  return {
    selectedCardId: requireText(
      selection.selectedCardId,
      "mockUserSelection.selectedCardId",
    ),
    preserveElement: requireText(
      selection.preserveElement,
      "mockUserSelection.preserveElement",
    ),
    feedback: requireText(selection.feedback, "mockUserSelection.feedback"),
  };
}

function normalizeEvidence(evidence, sourceType) {
  if (sourceType !== "real") {
    return null;
  }

  if (!evidence || typeof evidence !== "object") {
    throw new Error('Real case field "evidence" is required.');
  }

  return {
    sourceLink: compactText(evidence.sourceLink),
    screenshotPath: compactText(evidence.screenshotPath),
    notes: requireText(evidence.notes, "evidence.notes"),
  };
}

function normalizeTracking(tracking, sourceType) {
  if (sourceType !== "real") {
    return null;
  }

  if (!tracking || typeof tracking !== "object") {
    throw new Error('Real case field "tracking" is required.');
  }

  return {
    platformCaseId: requireText(tracking.platformCaseId, "tracking.platformCaseId"),
    obsidianCasePath: requireText(tracking.obsidianCasePath, "tracking.obsidianCasePath"),
  };
}

function normalizeOperations(operations) {
  if (!operations) {
    return {
      keyCaseRerunPriority: 0,
      maintenanceTags: [],
    };
  }

  if (typeof operations !== "object" || Array.isArray(operations)) {
    throw new Error('Case field "operations" must be an object.');
  }

  const keyCaseRerunPriority = Number(operations.keyCaseRerunPriority || 0);

  if (!Number.isFinite(keyCaseRerunPriority) || keyCaseRerunPriority < 0) {
    throw new Error('Case field "operations.keyCaseRerunPriority" must be a non-negative number.');
  }

  const maintenanceTags = Array.isArray(operations.maintenanceTags)
    ? operations.maintenanceTags.map((item) => compactText(item)).filter(Boolean)
    : [];

  return {
    keyCaseRerunPriority,
    maintenanceTags,
  };
}

export function validateCaseRecord(record, fallbackSourceType) {
  if (!record || typeof record !== "object") {
    throw new Error("Case record must be an object.");
  }

  const sourceType = compactText(record.sourceType || fallbackSourceType);

  if (!allowedSourceTypes.has(sourceType)) {
    throw new Error(`Unsupported case sourceType: ${sourceType || "unknown"}`);
  }

  return {
    id: requireText(record.id, "id"),
    title: requireText(record.title, "title"),
    sourceType,
    platform: requireText(record.platform, "platform"),
    contentTopic: requireText(record.contentTopic, "contentTopic"),
    contentGoal: requireText(record.contentGoal, "contentGoal"),
    userAssetType: requireText(record.userAssetType, "userAssetType"),
    assetDescription: requireText(record.assetDescription, "assetDescription"),
    referencePreference: requireText(
      record.referencePreference,
      "referencePreference",
    ),
    assetNotes: requireText(record.assetNotes, "assetNotes"),
    operations: normalizeOperations(record.operations),
    tracking: normalizeTracking(record.tracking, sourceType),
    evidence: normalizeEvidence(record.evidence, sourceType),
    mockUserSelection: normalizeMockUserSelection(record.mockUserSelection),
  };
}
