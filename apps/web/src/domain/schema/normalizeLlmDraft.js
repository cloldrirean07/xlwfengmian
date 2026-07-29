import { compactText } from "../../shared/text.js";

function normalizeHighlights(value) {
  if (Array.isArray(value)) {
    return value.map((item) => compactText(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split("\n")
      .map((line) => compactText(line))
      .filter(Boolean);
  }

  return [];
}

function normalizeCard(card, fallbackIndex) {
  return {
    cardId: compactText(card.cardId) || `CARD-${fallbackIndex + 1}`,
    label: compactText(card.label) || "未命名方向",
    copy: compactText(card.copy) || "未生成封面大字",
    reason: compactText(card.reason) || "未生成点击理由",
  };
}

export function normalizeFirstRoundDraft(draft) {
  return {
    ...draft,
    summary: compactText(draft.summary),
    highlights: normalizeHighlights(draft.highlights),
    draftCards: Array.isArray(draft.draftCards)
      ? draft.draftCards.map((card, index) => normalizeCard(card, index))
      : [],
  };
}

export function normalizeSecondRoundDraft(draft) {
  return {
    ...draft,
    summary: compactText(draft.summary),
    highlights: normalizeHighlights(draft.highlights),
    refinedDirection: compactText(draft.refinedDirection),
    changeFocus: compactText(draft.changeFocus),
    refinedCopy: compactText(draft.refinedCopy),
  };
}
