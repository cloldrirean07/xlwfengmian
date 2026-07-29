import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..", "..", "..", "..");
const rulesRoot = join(__dirname, "data", "rules");

let coverEffectCache = null;
let feedbackCatalogCache = null;
let coverDirectionSignalCache = null;
let ruleCatalogMetaCache = null;

function readJson(relativePath) {
  const raw = readFileSync(join(rulesRoot, relativePath), "utf-8");
  return JSON.parse(raw);
}

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Invalid rule catalog: ${label} must be a non-empty string`);
  }
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid rule catalog: ${label} must be a non-empty string array`);
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid rule catalog: ${label} must be an object`);
  }
}

function validateCoverEffectCatalog(catalog) {
  assertObject(catalog, "cover-effect root");
  assertStringArray(catalog.order, "cover-effect order");
  assertObject(catalog.effects, "cover-effect effects");

  for (const effectId of catalog.order) {
    const effect = catalog.effects[effectId];
    assertObject(effect, `cover-effect ${effectId}`);
    assertString(effect.id, `cover-effect ${effectId}.id`);
    assertString(effect.internalName, `cover-effect ${effectId}.internalName`);
    assertString(effect.userLabel, `cover-effect ${effectId}.userLabel`);
    assertString(effect.clickDriver, `cover-effect ${effectId}.clickDriver`);
    assertString(effect.effectSummary, `cover-effect ${effectId}.effectSummary`);
    assertStringArray(effect.bestFor, `cover-effect ${effectId}.bestFor`);
    assertStringArray(effect.signalKeywords, `cover-effect ${effectId}.signalKeywords`);
    assertStringArray(effect.defaultRisks, `cover-effect ${effectId}.defaultRisks`);
    assertStringArray(effect.coverCopyTemplates, `cover-effect ${effectId}.coverCopyTemplates`);
    assertStringArray(effect.titleTemplates, `cover-effect ${effectId}.titleTemplates`);
    assertStringArray(effect.visualHints, `cover-effect ${effectId}.visualHints`);
    assertStringArray(effect.compositionHints, `cover-effect ${effectId}.compositionHints`);
    assertObject(effect.imageStrategies, `cover-effect ${effectId}.imageStrategies`);

    for (const [assetType, strategy] of Object.entries(effect.imageStrategies)) {
      assertString(assetType, `cover-effect ${effectId}.imageStrategies assetType`);
      assertString(strategy, `cover-effect ${effectId}.imageStrategies.${assetType}`);
    }
  }
}

function validateCoverDirectionSignalCatalog(catalog) {
  assertObject(catalog, "cover-direction-signal root");
  assertStringArray(catalog.order, "cover-direction-signal order");
  assertObject(catalog.directions, "cover-direction-signal directions");

  for (const directionId of catalog.order) {
    const direction = catalog.directions[directionId];
    assertObject(direction, `cover-direction-signal ${directionId}`);
    assertString(direction.id, `cover-direction-signal ${directionId}.id`);

    if (!Array.isArray(direction.signalGroups) || direction.signalGroups.length === 0) {
      throw new Error(
        `Invalid rule catalog: cover-direction-signal ${directionId}.signalGroups must be a non-empty array`,
      );
    }

    for (const [index, group] of direction.signalGroups.entries()) {
      assertObject(group, `cover-direction-signal ${directionId}.signalGroups[${index}]`);
      assertString(
        group.groupId,
        `cover-direction-signal ${directionId}.signalGroups[${index}].groupId`,
      );
      assertString(
        group.groupLabel,
        `cover-direction-signal ${directionId}.signalGroups[${index}].groupLabel`,
      );
      assertStringArray(
        group.signals,
        `cover-direction-signal ${directionId}.signalGroups[${index}].signals`,
      );
    }

    assertStringArray(
      direction.feedbackTriggers,
      `cover-direction-signal ${directionId}.feedbackTriggers`,
    );
    assertStringArray(
      direction.boundaryRules,
      `cover-direction-signal ${directionId}.boundaryRules`,
    );
  }
}

function validateFeedbackCatalog(catalog) {
  assertObject(catalog, "feedback root");

  if (!Array.isArray(catalog.negativeMappings) || catalog.negativeMappings.length === 0) {
    throw new Error("Invalid rule catalog: feedback negativeMappings must be a non-empty array");
  }

  if (!Array.isArray(catalog.positiveMappings) || catalog.positiveMappings.length === 0) {
    throw new Error("Invalid rule catalog: feedback positiveMappings must be a non-empty array");
  }

  assertObject(catalog.variableToUserLabel, "feedback variableToUserLabel");
  assertObject(catalog.effectToPrimaryVariable, "feedback effectToPrimaryVariable");

  for (const [index, item] of catalog.negativeMappings.entries()) {
    assertObject(item, `feedback negativeMappings[${index}]`);
    assertString(item.id, `feedback negativeMappings[${index}].id`);
    assertString(item.issue, `feedback negativeMappings[${index}].issue`);
    assertString(item.targetVariable, `feedback negativeMappings[${index}].targetVariable`);
    assertString(item.supportVariable, `feedback negativeMappings[${index}].supportVariable`);
    assertString(item.action, `feedback negativeMappings[${index}].action`);
    assertStringArray(item.keywords, `feedback negativeMappings[${index}].keywords`);
  }

  for (const [index, item] of catalog.positiveMappings.entries()) {
    assertObject(item, `feedback positiveMappings[${index}]`);
    assertString(item.id, `feedback positiveMappings[${index}].id`);
    assertString(item.signal, `feedback positiveMappings[${index}].signal`);
    assertString(item.preserveVariable, `feedback positiveMappings[${index}].preserveVariable`);
    assertStringArray(item.keywords, `feedback positiveMappings[${index}].keywords`);
  }

  for (const [variableKey, variableLabel] of Object.entries(catalog.variableToUserLabel)) {
    assertString(variableKey, "feedback variableToUserLabel key");
    assertString(variableLabel, `feedback variableToUserLabel.${variableKey}`);
  }

  for (const [effectId, variableName] of Object.entries(catalog.effectToPrimaryVariable)) {
    assertString(effectId, "feedback effectToPrimaryVariable key");
    assertString(variableName, `feedback effectToPrimaryVariable.${effectId}`);
  }
}

function buildRuleCatalogMeta(coverEffectCatalog, feedbackCatalog, coverDirectionSignalCatalog) {
  const content = JSON.stringify({
    coverEffectCatalog,
    feedbackCatalog,
    coverDirectionSignalCatalog,
  });
  const version = crypto.createHash("sha1").update(content).digest("hex").slice(0, 10);

  return {
    source: "local-json",
    version,
    effectCount: coverEffectCatalog.order.length,
    negativeMappingCount: feedbackCatalog.negativeMappings.length,
    positiveMappingCount: feedbackCatalog.positiveMappings.length,
    directionSignalCount: coverDirectionSignalCatalog.order.length,
  };
}

export function loadCoverEffectCatalog() {
  if (!coverEffectCache) {
    const catalog = readJson("cover-effect-catalog.json");
    validateCoverEffectCatalog(catalog);
    coverEffectCache = catalog;
  }

  return coverEffectCache;
}

export function loadFeedbackCatalog() {
  if (!feedbackCatalogCache) {
    const catalog = readJson("feedback-catalog.json");
    validateFeedbackCatalog(catalog);
    feedbackCatalogCache = catalog;
  }

  return feedbackCatalogCache;
}

export function loadCoverDirectionSignalCatalog() {
  if (!coverDirectionSignalCache) {
    const catalog = readJson("cover-direction-signal-catalog.json");
    validateCoverDirectionSignalCatalog(catalog);
    coverDirectionSignalCache = catalog;
  }

  return coverDirectionSignalCache;
}

export function getRuleCatalogMeta() {
  if (!ruleCatalogMetaCache) {
    ruleCatalogMetaCache = buildRuleCatalogMeta(
      loadCoverEffectCatalog(),
      loadFeedbackCatalog(),
      loadCoverDirectionSignalCatalog(),
    );
  }

  return ruleCatalogMetaCache;
}

export function resetRuleCatalogCache() {
  coverEffectCache = null;
  feedbackCatalogCache = null;
  coverDirectionSignalCache = null;
  ruleCatalogMetaCache = null;
}
