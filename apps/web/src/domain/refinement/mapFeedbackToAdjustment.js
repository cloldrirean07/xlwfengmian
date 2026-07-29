import { includesAny } from "../../shared/text.js";
import {
  effectToPrimaryVariable,
  feedbackMappings,
  positiveFeedbackMappings,
  variableToUserLabel,
} from "./feedbackMappings.js";

function cleanExtractedSegment(segment) {
  return String(segment || "")
    .replace(/^(住|一下|一点|部分|当前|原来|原有|这张|该)/u, "")
    .replace(/[，。；;,.、\s]+$/u, "")
    .trim();
}

function extractPreserveElementFromFeedback(feedbackRaw) {
  const feedback = String(feedbackRaw || "").trim();

  if (!feedback) {
    return "";
  }

  const patterns = [
    /(?:保留|保持|留下|延续)(.+?)(?:，|。|；|;|,|但|但是|不过|同时|然后|再|并|且|$)/u,
    /(?:不要动|别改)(.+?)(?:，|。|；|;|,|但|但是|不过|同时|然后|再|并|且|$)/u,
  ];

  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    const preserved = cleanExtractedSegment(match?.[1]);

    if (preserved) {
      return preserved;
    }
  }

  return "";
}

function extractChangeRequestFromFeedback(feedbackRaw) {
  const feedback = String(feedbackRaw || "").trim();

  if (!feedback) {
    return "";
  }

  const patterns = [
    /(?:但|但是|不过|同时|然后|再|并且|并|且)(.+)$/u,
    /(?:希望|想要|需要|调整|改成|改为|降低|提高|强化|弱化|减少|增加)(.+)$/u,
  ];

  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    const request = cleanExtractedSegment(match?.[1]);

    if (request) {
      return request;
    }
  }

  return feedback;
}

export function mapFeedbackToAdjustment({
  selectedCard,
  feedback,
  preserveElement = "",
  workspaceContext = null,
}) {
  const feedbackRaw = `${feedback || ""}`.trim();
  const preserveRaw = `${preserveElement || ""}`.trim();
  const inferredPreserveElement = preserveRaw || extractPreserveElementFromFeedback(feedbackRaw);
  const changeRequest = extractChangeRequestFromFeedback(feedbackRaw);
  const workspaceRaw = workspaceContext
    ? `${workspaceContext.summary || ""} ${workspaceContext.refinedTask || ""} ${workspaceContext.nextSuggestion || ""}`.trim()
    : "";
  const raw = `${feedbackRaw} ${preserveRaw} ${workspaceRaw}`.trim();
  const matched =
    feedbackMappings.find((mapping) => includesAny(raw, mapping.keywords)) || feedbackMappings[0];
  const positiveMatch =
    positiveFeedbackMappings.find((mapping) => includesAny(raw, mapping.keywords)) || null;
  const matchedKeywords = matched.keywords.filter((keyword) => raw.includes(keyword));
  const preservedVariable =
    positiveMatch?.preserveVariable ||
    effectToPrimaryVariable[selectedCard.effectId] ||
    "信息";

  return {
    selectedCardId: selectedCard.cardId,
    selectedDirectionType: selectedCard.directionTypeInternal,
    userFeedbackRaw: feedback,
    preserveElement: inferredPreserveElement || selectedCard.directionLabelUserFacing,
    preserveElementSource: preserveRaw ? "field" : inferredPreserveElement ? "feedback" : "fallback",
    changeRequest,
    changeRequestSource: changeRequest ? "feedback" : "fallback",
    feedbackPreservedSignal: positiveMatch?.signal || selectedCard.directionLabelUserFacing,
    preservedVariable,
    feedbackMappingId: matched.id,
    feedbackPositiveMappingId: positiveMatch?.id || null,
    feedbackMappedIssuePrimary: matched.issue,
    feedbackMappedIssueSecondary: "无",
    feedbackTargetVariable: matched.targetVariable,
    feedbackSupportVariable: matched.supportVariable,
    feedbackMatchedKeywords: matchedKeywords,
    feedbackUsedFallback: matchedKeywords.length === 0,
    feedbackAction: matched.action,
    nextRoundGoal: `保留「${variableToUserLabel[preservedVariable]}」的长处，但让结果更接近「${variableToUserLabel[matched.targetVariable]}」`,
    workspaceContext,
  };
}
