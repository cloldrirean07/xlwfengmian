import { loadFeedbackCatalog } from "../../infrastructure/rules/loadRuleCatalog.js";

const feedbackCatalog = loadFeedbackCatalog();

export const feedbackMappings = feedbackCatalog.negativeMappings;
export const positiveFeedbackMappings = feedbackCatalog.positiveMappings;
export const variableToUserLabel = feedbackCatalog.variableToUserLabel;
export const effectToPrimaryVariable = feedbackCatalog.effectToPrimaryVariable;
