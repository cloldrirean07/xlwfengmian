import { firstRoundDraftSchema } from "./firstRoundDraftSchema.js";
import { secondRoundDraftSchema } from "./secondRoundDraftSchema.js";

function ensureRequiredFields(target, fields, name) {
  for (const field of fields) {
    if (!(field in target)) {
      throw new Error(`${name} is missing required field: ${field}`);
    }
  }
}

function ensureNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
}

function ensureNonEmptyArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array.`);
  }
}

export function validateFirstRoundDraftOutput(draft) {
  ensureRequiredFields(draft, firstRoundDraftSchema.requiredFields, "firstRoundDraft");
  ensureNonEmptyString(draft.summary, "firstRoundDraft.summary");
  ensureNonEmptyArray(draft.highlights, "firstRoundDraft.highlights");
  ensureNonEmptyArray(draft.draftCards, "firstRoundDraft.draftCards");

  draft.draftCards.forEach((card, index) => {
    ensureRequiredFields(card, firstRoundDraftSchema.cardRequiredFields, `firstRoundDraft.card[${index}]`);
    ensureNonEmptyString(card.cardId, `firstRoundDraft.card[${index}].cardId`);
    ensureNonEmptyString(card.label, `firstRoundDraft.card[${index}].label`);
    ensureNonEmptyString(card.copy, `firstRoundDraft.card[${index}].copy`);
    ensureNonEmptyString(card.reason, `firstRoundDraft.card[${index}].reason`);
  });
}

export function validateSecondRoundDraftOutput(draft) {
  ensureRequiredFields(draft, secondRoundDraftSchema.requiredFields, "secondRoundDraft");
  ensureNonEmptyString(draft.summary, "secondRoundDraft.summary");
  ensureNonEmptyArray(draft.highlights, "secondRoundDraft.highlights");
  ensureNonEmptyString(draft.refinedDirection, "secondRoundDraft.refinedDirection");
  ensureNonEmptyString(draft.changeFocus, "secondRoundDraft.changeFocus");
  ensureNonEmptyString(draft.refinedCopy, "secondRoundDraft.refinedCopy");
}
