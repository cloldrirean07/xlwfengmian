import { compactText } from "../../shared/text.js";

function isFilled(value) {
  const normalized = compactText(value);
  return normalized && !normalized.startsWith("待补");
}

function joinFilled(values) {
  return values.map((value) => compactText(value)).filter(Boolean).join("；");
}

function mapLinkField(value) {
  const normalized = compactText(value);
  if (!normalized) {
    return { sourceLink: "", screenshotPath: "" };
  }

  if (/^https?:\/\//u.test(normalized)) {
    return { sourceLink: normalized, screenshotPath: "" };
  }

  return { sourceLink: "", screenshotPath: normalized };
}

export function buildRealCaseUpdateFromPlatformNote(record, parsedNote) {
  const linkMapping = mapLinkField(parsedNote.link_or_asset_path);
  const assetDescription = joinFilled([
    parsedNote.subject_description,
    parsedNote.visual_focus,
  ]);
  const assetNotes = joinFilled([
    parsedNote.composition_features,
    parsedNote.color_mood_features,
    parsedNote.title_cover_relationship,
  ]);

  return {
    id: record.id,
    updates: {
      contentTopic: isFilled(parsedNote.content_topic) ? parsedNote.content_topic : record.contentTopic,
      contentGoal: isFilled(parsedNote.content_goal_guess)
        ? parsedNote.content_goal_guess
        : record.contentGoal,
      assetDescription: isFilled(assetDescription) ? assetDescription : record.assetDescription,
      assetNotes: isFilled(assetNotes) ? assetNotes : record.assetNotes,
      referencePreference: isFilled(parsedNote.likely_positive_feedback)
        ? parsedNote.likely_positive_feedback
        : record.referencePreference,
      evidence: {
        ...record.evidence,
        sourceLink: isFilled(linkMapping.sourceLink) ? linkMapping.sourceLink : record.evidence.sourceLink,
        screenshotPath: isFilled(linkMapping.screenshotPath)
          ? linkMapping.screenshotPath
          : record.evidence.screenshotPath,
      },
      mockUserSelection: {
        ...record.mockUserSelection,
        preserveElement: isFilled(parsedNote.likely_positive_feedback)
          ? parsedNote.likely_positive_feedback
          : record.mockUserSelection.preserveElement,
        feedback: isFilled(parsedNote.possible_adjustment_direction)
          ? parsedNote.possible_adjustment_direction
          : record.mockUserSelection.feedback,
      },
    },
    extracted: {
      content_topic: parsedNote.content_topic || "",
      content_goal_guess: parsedNote.content_goal_guess || "",
      link_or_asset_path: parsedNote.link_or_asset_path || "",
      subject_description: parsedNote.subject_description || "",
      visual_focus: parsedNote.visual_focus || "",
      likely_positive_feedback: parsedNote.likely_positive_feedback || "",
      possible_adjustment_direction: parsedNote.possible_adjustment_direction || "",
    },
  };
}
