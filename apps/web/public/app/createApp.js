import {
  buildAssetPreview,
  revokeAssetPreview,
} from "./assetPreview.js";
import {
  analyzeCoverDirection,
  applyBatchReviewManualConfirmationSafePreviewWrite,
  applyTitleSelectionWriteback,
  classifyRequestError,
  buildPromptPreview,
  commitRealCaseBatchScaffold,
  commitRealCaseScaffold,
  exportBatchRunFrictionSummary,
  exportBatchReviewManualTaskCard,
  exportBatchReviewManualBackfill,
  exportBatchReviewManualFormalWrite,
  exportBatchReviewManualSafeWrite,
  exportBatchReviewManualWritebackDraft,
  exportBatchReviewDashboard,
  exportBatchReviewSuite,
  exportRealCaseBatchFillWorksheet,
  exportRealCaseBatchRunRecord,
  exportRealCaseFillToObsidian,
  exportUiOptimizationReadiness,
  generateLlmDraft,
  loadAvailableCases,
  loadRealCaseBatchFillWorksheetHistory,
  loadPlatformBatchReview,
  loadPlatformReview,
  loadPlatformSyncPreview,
  previewBatchRunFrictionSummary,
  previewBatchReviewDashboard,
  previewBatchReviewManualConfirmationApplyPreview,
  previewBatchReviewManualConfirmationDecision,
  previewBatchReviewManualConfirmationDecisionAdoptionPacket,
  previewBatchReviewManualConfirmationDecisionAdoptionPreview,
  previewBatchReviewManualConfirmationSafePreviewAdoptionPacket,
  previewBatchReviewManualConfirmationSafePreviewWritePrecheck,
  previewBatchReviewManualConfirmationSafePreviewWriteProjection,
  previewBatchReviewManualConfirmationDraftValidation,
  previewBatchReviewManualConfirmationHandoffPacket,
  previewBatchReviewManualFormalWriteExecutionPrecheck,
  previewBatchReviewManualFormalWriteExecutionPacket,
  previewBatchReviewManualFormalWritePostExecutionAcceptance,
  previewBatchReviewManualFormalWriteReadiness,
  previewFormalWriteFollowUpPlan,
  previewPiEngineExecutionPositionAudit,
  previewUiOptimizationReadiness,
  previewRealCaseBatchFillWorksheet,
  previewRealCaseBatchRunRecord,
  loadRealCaseFillPreview,
  loadSampleCases,
  previewRealCaseBatchScaffold,
  previewRealCaseScaffold,
  refineDirection,
  runActionWorkspace,
  runAvailableCase,
  runSampleCase,
  saveWorkspaceDecision,
} from "./api.js";
import { getDomRefs } from "./dom.js";
import {
  hide,
  patchFormValues,
  renderAnalysisOverview,
  renderActionWorkspace,
  renderActionWorkspaceForm,
  renderActionWorkspacePathSelector,
  renderActionWorkspaceResult,
  renderAssetPreview,
  renderBatchRunFrictionSummaryResult,
  renderBatchReviewDashboardResult,
  renderCards,
  renderLlmDraft,
  renderPlatformBatchReview,
  renderPlatformReview,
  renderPlatformSyncPreview,
  renderPromptPreview,
  renderRealCaseBatchCommitResult,
  renderRealCaseBatchPreview,
  renderRealCaseBatchRunRecordResult,
  renderRealCaseBatchWorksheetResult,
  renderRealCaseCommitResult,
  renderRealCaseExportResult,
  renderRealCaseLibrary,
  renderRealCaseMaintenancePreview,
  renderRealCasePreview,
  renderRealCaseQuickStart,
  renderRefinementResult,
  renderRefineWorkspaceHint,
  renderSampleRun,
  renderSelectedCardSummary,
  renderUiOptimizationReadinessResult,
  renderWritebackGateOverviewStatus,
  renderWorkspaceDecisionStatus,
  reveal,
  serializeForm,
  setStatus,
} from "./renderers.js";
import { createState } from "./state.js";

function clearLocalAsset(dom, state) {
  revokeAssetPreview(state.assetPreview);
  state.assetPreview = null;
  dom.assetUploadInput.value = "";
  renderAssetPreview(dom.assetPreviewPanel, dom.assetPreviewContent, dom.clearAssetButton, null);
}

function buildAnalyzePayload(dom, state) {
  const payload = serializeForm(dom.analyzeForm);

  if (!state.assetPreview) {
    return payload;
  }

  return {
    ...payload,
    assetContext: {
      origin: "local-preview",
      fileName: state.assetPreview.fileName,
      mimeType: state.assetPreview.mimeType,
      sizeLabel: state.assetPreview.sizeLabel,
      dimensionsLabel: state.assetPreview.dimensionsLabel,
      hasLocalPreview: true,
    },
  };
}

const analyzeFieldRules = [
  {
    name: "contentTopic",
    label: "内容主题",
    requiredMessage: "请输入内容主题",
    maxLength: 80,
  },
  {
    name: "contentGoal",
    label: "内容目标",
    requiredMessage: "请输入内容目标",
    maxLength: 120,
  },
  {
    name: "platform",
    label: "目标平台",
    requiredMessage: "请选择目标平台",
    allowedValues: ["抖音", "小红书", "Instagram"],
    unavailableMessage: "目标平台不可用，请重新选择",
  },
  {
    name: "userAssetType",
    label: "素材类型",
    requiredMessage: "请选择素材类型",
    allowedValues: ["截图", "人像", "场景图", "商品图", "无图只有想法"],
    unavailableMessage: "素材类型不可用，请重新选择",
  },
  {
    name: "assetDescription",
    label: "素材描述",
    maxLength: 300,
  },
  {
    name: "referencePreference",
    label: "封面倾向",
    maxLength: 120,
  },
  {
    name: "assetNotes",
    label: "补充说明",
    maxLength: 300,
  },
];

function getFieldValue(payload, name) {
  return String(payload?.[name] || "").trim();
}

function hasNonEmptyText(value) {
  return Boolean(String(value || "").trim());
}

function hasNonEmptyTextItem(items) {
  return Array.isArray(items) && items.some((item) => String(item || "").trim());
}

export function validateAnalyzePayloadFields(payload) {
  for (const rule of analyzeFieldRules) {
    const value = getFieldValue(payload, rule.name);

    if (rule.requiredMessage && !value) {
      return {
        ok: false,
        fieldName: rule.name,
        message: rule.requiredMessage,
      };
    }

    if (rule.allowedValues && value && !rule.allowedValues.includes(value)) {
      return {
        ok: false,
        fieldName: rule.name,
        message: rule.unavailableMessage,
      };
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return {
        ok: false,
        fieldName: rule.name,
        message: `${rule.label}最多输入 ${rule.maxLength} 个字符`,
      };
    }
  }

  return {
    ok: true,
    fieldName: "",
    message: "",
  };
}

export function validateAnalysisResultCompleteness(analysis) {
  const cards = Array.isArray(analysis?.cards) ? analysis.cards : [];

  if (cards.length !== 3) {
    return {
      ok: false,
      message: "方向结果不完整，请重新生成",
    };
  }

  const hasIncompleteCard = cards.some(
    (card) =>
      !hasNonEmptyText(card?.cardId) ||
      !hasNonEmptyText(card.directionLabelUserFacing) ||
      !hasNonEmptyText(card.clickReason) ||
      !hasNonEmptyText(card.coverCopyMain) ||
      !hasNonEmptyTextItem(card.titleOptions) ||
      !hasNonEmptyText(card.imageDirection) ||
      !hasNonEmptyText(card.fitReason) ||
      !hasNonEmptyTextItem(card.signalMatches) ||
      !hasNonEmptyText(card.riskNote),
  );

  if (hasIncompleteCard) {
    return {
      ok: false,
      message: "方向结果不完整，请重新生成",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

export function validateRefinePayloadFields(payload) {
  const feedback = getFieldValue(payload, "feedback");

  if (!feedback) {
    return {
      ok: false,
      fieldName: "feedback",
      message: "请输入修改意见",
    };
  }

  if (feedback.length > 200) {
    return {
      ok: false,
      fieldName: "feedback",
      message: "修改意见最多输入 200 个字符",
    };
  }

  return {
    ok: true,
    fieldName: "",
    message: "",
  };
}

export function validateRefinementContext({ analysis, selectedCardId }) {
  if (!analysis || !selectedCardId) {
    return {
      ok: false,
      message: "请先选择一个封面方向",
    };
  }

  const selectedCard = analysis.cards?.find((card) => card.cardId === selectedCardId);

  if (!selectedCard) {
    return {
      ok: false,
      message: "当前结果已失效，请重新生成方向",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

export function validateRefinementResultCompleteness(result) {
  const refinedCard = result?.secondRound?.refinedCard;
  const mappingExplanation = result?.mappingExplanation;
  const hasModificationRationale =
    hasNonEmptyText(mappingExplanation?.summary) || hasNonEmptyTextItem(mappingExplanation?.explanationLines);

  if (
    !refinedCard ||
    !hasNonEmptyText(refinedCard.cardTitle) ||
    !hasNonEmptyText(refinedCard.directionDescription) ||
    !hasNonEmptyText(refinedCard.coverCopyMain) ||
    !hasNonEmptyTextItem(refinedCard.titleOptions) ||
    !hasNonEmptyText(refinedCard.imageDirection) ||
    !hasNonEmptyText(refinedCard.riskNote) ||
    !hasModificationRationale
  ) {
    return {
      ok: false,
      message: "修订失败，请重试",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

export function validateActionWorkspaceContext({ analysis, selectedCardId }) {
  if (!analysis || !selectedCardId) {
    return {
      ok: false,
      message: "请先选择一个封面方向",
    };
  }

  const selectedCard = analysis.cards?.find((card) => card.cardId === selectedCardId);

  if (!selectedCard) {
    return {
      ok: false,
      message: "当前方向已失效，请重新选择",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

export function validateActionWorkspacePayloadFields(payload) {
  const entries = Object.entries(payload || {});
  const filledEntry = entries.find(([, value]) => String(value || "").trim());

  if (!filledEntry) {
    return {
      ok: false,
      fieldName: entries[0]?.[0] || "",
      message: "请补充至少一项路径信息",
    };
  }

  const tooLongEntry = entries.find(([, value]) => String(value || "").trim().length > 200);

  if (tooLongEntry) {
    return {
      ok: false,
      fieldName: tooLongEntry[0],
      message: "路径信息最多输入 200 个字符",
    };
  }

  return {
    ok: true,
    fieldName: "",
    message: "",
  };
}

export function buildTitleWritebackPreview({ titleSelection, currentCopyReview = {} }) {
  if (!titleSelection?.copyReviewDraft?.preferredTitle) {
    return null;
  }

  const nextPreferredTitle = titleSelection.copyReviewDraft.preferredTitle;
  const nextTitleRationale = titleSelection.copyReviewDraft.titleSelectionReason;

  return {
    mode: "preview-only",
    targetPath: "copyReview",
    statusLabel: "待确认写入",
    safetyNote: "当前仅生成写回预览，不会修改真实案例文件。",
    patchFields: [
      {
        fieldPath: "copyReview.preferredTitle",
        currentValue: String(currentCopyReview?.preferredTitle || "待补充"),
        nextValue: nextPreferredTitle,
      },
      {
        fieldPath: "copyReview.titleRationale",
        currentValue: String(currentCopyReview?.titleRationale || "待补充"),
        nextValue: nextTitleRationale,
      },
    ],
    nextCopyReview: {
      ...currentCopyReview,
      preferredTitle: nextPreferredTitle,
      titleRationale: nextTitleRationale,
    },
  };
}

export function buildTitleSelectionDraft({ card, titleOption, currentCopyReview = {} }) {
  const preferredTitle = String(titleOption?.title || "").trim();

  if (!card || !preferredTitle) {
    return null;
  }

  const sourceLabel = String(titleOption?.sourceLabel || "标题建议").trim();
  const styleLabel = String(titleOption?.styleLabel || "基础模板").trim();
  const directionLabel = String(card.directionLabelUserFacing || "首轮方向").trim();

  const titleSelection = {
    cardId: card.cardId,
    directionLabel,
    preferredTitle,
    sourceLabel,
    styleLabel,
    copyReviewDraft: {
      preferredTitle,
      titleSelectionReason: `${sourceLabel} / ${styleLabel}，来自「${directionLabel}」方向候选，适合作为人工优选标题继续复跑。`,
    },
  };

  return {
    ...titleSelection,
    writebackPreview: buildTitleWritebackPreview({
      titleSelection,
      currentCopyReview,
    }),
  };
}

export function shouldInvalidateRefinementForCardChange({
  currentCardId,
  nextCardId,
  latestRefinement,
}) {
  return Boolean(latestRefinement && currentCardId && nextCardId && currentCardId !== nextCardId);
}

export function shouldInvalidateWorkspaceForCardChange({
  currentCardId,
  nextCardId,
  latestWorkspaceResult,
  latestWorkspaceDecisionSave,
}) {
  return Boolean(
    (latestWorkspaceResult || latestWorkspaceDecisionSave) &&
      currentCardId &&
      nextCardId &&
      currentCardId !== nextCardId,
  );
}

export function validateExistingCaseSelection({ caseId, cases, sourceType = "real" }) {
  const selectedCaseId = String(caseId || "").trim();

  if (!selectedCaseId) {
    return {
      ok: false,
      caseRecord: null,
      message: "请选择需要复盘的案例",
    };
  }

  const caseRecord =
    (cases || []).find(
      (item) => item.id === selectedCaseId && (!sourceType || item.sourceType === sourceType),
    ) || null;

  if (!caseRecord) {
    return {
      ok: false,
      caseRecord: null,
      message: "案例不可用，请刷新后重试",
    };
  }

  return {
    ok: true,
    caseRecord,
    message: "",
  };
}

function hasOwnField(source, fieldName) {
  return Boolean(source && Object.prototype.hasOwnProperty.call(source, fieldName));
}

function validateFormalWriteManualReviewConclusion(safeWriteStatus) {
  const hasTopLevelConclusion = hasOwnField(safeWriteStatus, "manualReviewConclusion");
  const hasParsedConclusion = hasOwnField(safeWriteStatus?.parsed, "manualReviewConclusion");

  if (!hasTopLevelConclusion && !hasParsedConclusion) {
    return safeWriteStatus?.manualReviewConclusionValidation || { ok: true, message: "" };
  }

  const conclusion = String(
    hasTopLevelConclusion
      ? safeWriteStatus.manualReviewConclusion
      : safeWriteStatus.parsed.manualReviewConclusion,
  ).trim();

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

  return safeWriteStatus?.manualReviewConclusionValidation || { ok: true, message: "" };
}

export function validateFormalWriteReadiness(readiness) {
  if (readiness?.status === "awaiting-manual-decision-adoption") {
    return {
      ok: false,
      message: "请先采用推荐确认块",
    };
  }

  if (readiness?.status !== "ready-to-formal-write") {
    return {
      ok: false,
      message: "请先确认写回内容",
    };
  }

  const safeWriteStatus = readiness.latestSafeWriteStatus || null;

  if (!safeWriteStatus?.readbackOk || !safeWriteStatus.matchedExpectedContent) {
    return {
      ok: false,
      message: "请先生成写回预览并确认内容",
    };
  }

  const manualReviewConclusionValidation = validateFormalWriteManualReviewConclusion(safeWriteStatus);

  if (!manualReviewConclusionValidation?.ok) {
    return {
      ok: false,
      message: manualReviewConclusionValidation?.message || "请输入人工复盘结论",
    };
  }

  if (!safeWriteStatus.canProceedToFormalWrite) {
    return {
      ok: false,
      message: "请先确认写回内容",
    };
  }

  const manualConfirmationDecision = readiness.manualConfirmationDecision || null;

  if (
    manualConfirmationDecision &&
    (
      manualConfirmationDecision.decisionStatus !== "adopt-recommended" ||
      !manualConfirmationDecision.canProceedToSafePreviewWrite
    )
  ) {
    return {
      ok: false,
      message: "请先采用推荐确认块",
    };
  }

  return {
    ok: true,
    message: "",
  };
}

export function getCaseReviewActionFailureMessage(action = "") {
  return action === "export-obsidian-fill" ? "导出失败，请重试" : "案例读取失败，请重试";
}

export function getFirstRoundGenerationFailureMessage(error) {
  const requestError = classifyRequestError(error);

  if (requestError.type === "network") {
    return requestError.message;
  }

  if (requestError.type === "server") {
    return "生成失败，请重试";
  }

  return "方向结果生成失败，请重试";
}

function clearAnalyzeValidation(form) {
  for (const rule of analyzeFieldRules) {
    form.elements[rule.name]?.setCustomValidity("");
  }
}

function applyAnalyzeValidation(form, validation) {
  clearAnalyzeValidation(form);

  if (validation.ok) {
    return;
  }

  const field = form.elements[validation.fieldName];
  field?.setCustomValidity(validation.message);
  field?.reportValidity();
}

function setAnalyzeFormSubmitting(form, isSubmitting) {
  const submitButton = form.querySelector("button[type='submit']");

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "正在生成封面方案..." : "生成封面方案";
}

function clearRefineValidation(form) {
  form.elements.feedback?.setCustomValidity("");
}

function applyRefineValidation(form, validation) {
  clearRefineValidation(form);

  if (validation.ok) {
    return;
  }

  const field = form.elements[validation.fieldName];
  field?.setCustomValidity(validation.message);
  field?.reportValidity();
}

function clearActionWorkspaceValidation(form) {
  Array.from(form.elements).forEach((field) => {
    field.setCustomValidity?.("");
  });
}

function applyActionWorkspaceValidation(form, validation) {
  clearActionWorkspaceValidation(form);

  if (validation.ok) {
    return;
  }

  const field = form.elements[validation.fieldName];
  field?.setCustomValidity(validation.message);
  field?.reportValidity();
}

function setRefineFormSubmitting(form, isSubmitting) {
  const submitButton = form.querySelector("button[type='submit']");

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "正在生成第二轮优化结果..." : "生成第二轮优化结果";
}

function setActionWorkspaceSubmitting(button, workspace, isSubmitting) {
  if (!button) {
    return;
  }

  button.disabled = isSubmitting || !workspace?.inputSchema?.length;
  button.textContent = isSubmitting
    ? "正在生成工作区建议..."
    : workspace?.workspaceTitle
      ? `生成${workspace.workspaceTitle}建议`
      : "生成工作区建议";
}

function setWorkspaceDecisionSubmitting(dom, decision, isSubmitting) {
  if (!isSubmitting) {
    return;
  }

  dom.workspaceAcceptButton.disabled = true;
  dom.workspaceRejectButton.disabled = true;
  dom.workspaceAcceptButton.textContent =
    decision === "accept" ? "正在保存采纳状态..." : "采纳并接入第二轮";
  dom.workspaceRejectButton.textContent =
    decision === "reject" ? "正在保存不采纳状态..." : "不采纳本次建议";
}

function buildPromptPayload(dom, state) {
  const acceptedWorkspaceResult = getAcceptedWorkspaceResult(state);

  if (state.selectedCardId && dom.refineForm.feedback.value.trim()) {
    return {
      analysis: state.latestAnalysis,
      selectedCardId: state.selectedCardId,
      feedback: dom.refineForm.feedback.value.trim(),
      preserveElement: dom.refineForm.preserveElement.value.trim(),
      workspaceResult: acceptedWorkspaceResult,
    };
  }

  return {
    analysis: state.latestAnalysis,
  };
}

function getAcceptedWorkspaceResult(state) {
  if (state.latestWorkspaceDecisionSave?.decision !== "accept") {
    return null;
  }

  return state.latestWorkspaceResult;
}

function getSelectedCard(state) {
  return state.latestAnalysis?.cards?.find((card) => card.cardId === state.selectedCardId) || null;
}

function getSelectedActionWorkspaces(state) {
  const selectedCard = getSelectedCard(state);

  if (!selectedCard) {
    return [];
  }

  if (Array.isArray(selectedCard.actionWorkspaces) && selectedCard.actionWorkspaces.length > 0) {
    return selectedCard.actionWorkspaces.map((workspace) => ({
      ...workspace,
      linkedCardDirection: selectedCard.directionLabelUserFacing,
    }));
  }

  const fallbackWorkspace = selectedCard.actionWorkspace || state.latestAnalysis?.actionWorkspace;

  return fallbackWorkspace
    ? [
        {
          ...fallbackWorkspace,
          linkedCardDirection: selectedCard.directionLabelUserFacing,
        },
      ]
    : [];
}

function getSelectedActionWorkspace(state) {
  const selectedCard = getSelectedCard(state);

  if (!selectedCard || !state.latestAnalysis?.actionWorkspace) {
    return null;
  }

  const workspaces = getSelectedActionWorkspaces(state);
  const selectedWorkspace =
    workspaces.find((workspace) => workspace.workspaceId === state.selectedWorkspaceId) ||
    workspaces.find((workspace) => workspace.workspaceId === selectedCard.actionWorkspace?.workspaceId) ||
    workspaces[0];

  if (!selectedWorkspace) {
    return null;
  }

  return selectedWorkspace;
}

function syncSelectedWorkspaceId(state) {
  const selectedWorkspace = getSelectedActionWorkspace(state);
  state.selectedWorkspaceId = selectedWorkspace?.workspaceId || "";
}

function clearWorkspaceResultState(dom, state) {
  state.latestWorkspaceResult = null;
  state.latestWorkspaceDecisionSave = null;
  renderActionWorkspaceResult(dom.actionWorkspaceResult, null);
  renderWorkspaceDecisionStatus(dom.workspaceDecisionStatus, null, false);
  renderRefineWorkspaceHint(dom.refineWorkspaceHint, null, null);
  syncWorkspaceDecisionActions(dom, state);
}

function patchRealCaseTemplate(form) {
  form.id.value = "real-002";
  form.platformCaseId.value = "P-02";
  form.title.value = "待补真实案例 real-002";
  form.platform.value = "抖音";
  form.status.value = "draft";
  form.keyCaseRerunPriority.value = "5";
  form.maintenanceTags.value = "real-case, high-priority-candidate";
  form.obsidianCasePath.value = "";
  form.sourceLink.value = "";
  form.screenshotPath.value = "";
}

function buildRealCasePayload(dom) {
  const payload = serializeForm(dom.realCaseForm);

  return {
    ...payload,
    keyCaseRerunPriority: Number(payload.keyCaseRerunPriority || 0),
    maintenanceTags: String(payload.maintenanceTags || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function patchRealCaseBatchTemplate(form) {
  form.batchJson.value = JSON.stringify(
    [
      {
        id: "real-002",
        title: "待补真实案例 real-002",
        platform: "抖音",
        platformCaseId: "P-02",
        status: "draft",
        keyCaseRerunPriority: 5,
        maintenanceTags: ["real-case", "high-priority-candidate"],
        sourceLink: "",
        screenshotPath: "",
      },
      {
        id: "real-003",
        title: "待补真实案例 real-003",
        platform: "小红书",
        platformCaseId: "P-03",
        status: "ready",
        keyCaseRerunPriority: 8,
        maintenanceTags: ["real-case", "misclassified-high-frequency"],
        sourceLink: "",
        screenshotPath: "",
      },
    ],
    null,
    2,
  );
}

function buildRealCaseBatchPayload(dom) {
  const raw = dom.realCaseBatchForm.batchJson.value.trim();

  if (!raw) {
    throw new Error("请先填写批量真实案例 JSON。");
  }

  let batchItems;

  try {
    batchItems = JSON.parse(raw);
  } catch {
    throw new Error("批量真实案例 JSON 解析失败，请检查格式。");
  }

  if (!Array.isArray(batchItems) || batchItems.length === 0) {
    throw new Error("批量真实案例 JSON 必须是非空数组。");
  }

  return { batchItems };
}

function syncSelectionUi(dom, state) {
  renderCards(dom.cardsContainer,
    state.latestAnalysis?.cards || [],
    state.selectedCardId,
    state.latestTitleSelection,
    state.latestTitleWritebackApply,
  );
  renderSelectedCardSummary(dom.selectedCardSummary, state.latestAnalysis, state.selectedCardId);
}

function syncWorkspaceUi(dom, state) {
  syncSelectedWorkspaceId(state);
  const selectedWorkspace = getSelectedActionWorkspace(state);
  const selectedWorkspaces = getSelectedActionWorkspaces(state);

  renderActionWorkspace(dom.actionWorkspaceContent, selectedWorkspace);
  renderActionWorkspacePathSelector(
    dom.actionWorkspacePaths,
    selectedWorkspaces,
    state.selectedWorkspaceId,
  );
  renderActionWorkspaceForm(
    dom.actionWorkspaceFields,
    dom.actionWorkspaceRunButton,
    selectedWorkspace,
  );
  renderActionWorkspaceResult(dom.actionWorkspaceResult, state.latestWorkspaceResult);
  renderRefineWorkspaceHint(
    dom.refineWorkspaceHint,
    state.latestWorkspaceResult,
    state.latestWorkspaceDecisionSave,
  );
  renderWorkspaceDecisionStatus(
    dom.workspaceDecisionStatus,
    state.latestWorkspaceDecisionSave,
    Boolean(state.latestWorkspaceResult?.suggestion),
  );
  syncWorkspaceDecisionActions(dom, state);
}

export function syncWorkspaceDecisionActions(dom, state) {
  const hasSuggestion = Boolean(state.latestWorkspaceResult?.suggestion);
  const currentDecision = state.latestWorkspaceDecisionSave?.decision;

  if (hasSuggestion) {
    reveal(dom.workspaceDecisionRow);
  } else {
    hide(dom.workspaceDecisionRow);
  }

  dom.workspaceAcceptButton.disabled = !hasSuggestion || currentDecision === "accept";
  dom.workspaceRejectButton.disabled = !hasSuggestion || currentDecision === "reject";
  dom.workspaceAcceptButton.textContent =
    currentDecision === "accept" ? "已采纳这一步建议" : "采纳并接入第二轮";
  dom.workspaceRejectButton.textContent =
    currentDecision === "reject" ? "已标记不采纳" : "不采纳本次建议";
}

function buildDashboardRenderPayload(state, result) {
  if (!result) {
    return result;
  }

  return {
    ...result,
    followUpProgress: state.followUpActionStatus,
    formalWriteReadiness: state.latestFormalWriteReadiness,
    formalWriteExport: state.latestFormalWriteExport,
    manualConfirmationSafePreviewAdoptionPacket:
      state.latestManualConfirmationSafePreviewAdoptionPacket,
    manualConfirmationSafePreviewWritePrecheck:
      state.latestManualConfirmationSafePreviewWritePrecheck,
    manualConfirmationSafePreviewWriteProjection:
      state.latestManualConfirmationSafePreviewWriteProjection,
    manualConfirmationSafePreviewWriteApply:
      state.latestManualConfirmationSafePreviewWriteApply,
    manualFormalWriteExecutionPrecheck:
      state.latestManualFormalWriteExecutionPrecheck,
    manualFormalWriteExecutionPacket:
      state.latestManualFormalWriteExecutionPacket,
    manualFormalWritePostExecutionAcceptance:
      state.latestManualFormalWritePostExecutionAcceptance,
    piEngineExecutionPositionAudit:
      state.latestPiEngineExecutionPositionAudit,
    formalWriteFollowUpPlan:
      state.latestFormalWriteFollowUpPlan,
  };
}

function renderWritebackGateStatusFromState(dom, state) {
  renderWritebackGateOverviewStatus(
    dom.writebackGateStatusResult,
    state.latestFormalWriteReadiness,
    state.followUpActionStatus,
    state.latestManualConfirmationDraftValidation,
    state.latestManualConfirmationApplyPreview,
    state.latestManualConfirmationHandoffPacket,
    state.latestManualConfirmationDecision,
    state.latestManualConfirmationDecisionAdoptionPreview,
    state.latestManualConfirmationDecisionAdoptionPacket,
    state.latestManualConfirmationSafePreviewAdoptionPacket,
    state.latestManualConfirmationSafePreviewWritePrecheck,
    state.latestManualConfirmationSafePreviewWriteProjection,
    state.latestManualConfirmationSafePreviewWriteApply,
    state.latestManualFormalWriteExecutionPrecheck,
    state.latestManualFormalWriteExecutionPacket,
    state.latestManualFormalWritePostExecutionAcceptance,
    state.latestPiEngineExecutionPositionAudit,
    state.latestFormalWriteFollowUpPlan,
  );
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}

async function refreshFormalWriteGateEvidence(state) {
  const [
    readiness,
    draftValidation,
    applyPreview,
    handoffPacket,
    decision,
    adoptionPreview,
    adoptionPacket,
    safePreviewAdoptionPacket,
    safePreviewWritePrecheck,
    safePreviewWriteProjection,
    formalWriteExecutionPrecheck,
    formalWriteExecutionPacket,
    formalWritePostExecutionAcceptance,
    piEngineExecutionPositionAudit,
    formalWriteFollowUpPlan,
  ] = await Promise.all([
    previewBatchReviewManualFormalWriteReadiness(),
    previewBatchReviewManualConfirmationDraftValidation().catch(() => null),
    previewBatchReviewManualConfirmationApplyPreview().catch(() => null),
    previewBatchReviewManualConfirmationHandoffPacket().catch(() => null),
    previewBatchReviewManualConfirmationDecision().catch(() => null),
    previewBatchReviewManualConfirmationDecisionAdoptionPreview().catch(() => null),
    previewBatchReviewManualConfirmationDecisionAdoptionPacket().catch(() => null),
    previewBatchReviewManualConfirmationSafePreviewAdoptionPacket().catch(() => null),
    previewBatchReviewManualConfirmationSafePreviewWritePrecheck().catch(() => null),
    previewBatchReviewManualConfirmationSafePreviewWriteProjection().catch(() => null),
    previewBatchReviewManualFormalWriteExecutionPrecheck().catch(() => null),
    previewBatchReviewManualFormalWriteExecutionPacket().catch(() => null),
    previewBatchReviewManualFormalWritePostExecutionAcceptance().catch(() => null),
    previewPiEngineExecutionPositionAudit().catch(() => null),
    previewFormalWriteFollowUpPlan().catch(() => null),
  ]);

  state.latestFormalWriteReadiness = readiness;
  state.latestManualConfirmationDraftValidation = draftValidation;
  state.latestManualConfirmationApplyPreview = applyPreview;
  state.latestManualConfirmationHandoffPacket = handoffPacket;
  state.latestManualConfirmationDecision = decision;
  state.latestManualConfirmationDecisionAdoptionPreview = adoptionPreview;
  state.latestManualConfirmationDecisionAdoptionPacket = adoptionPacket;
  state.latestManualConfirmationSafePreviewAdoptionPacket = safePreviewAdoptionPacket;
  state.latestManualConfirmationSafePreviewWritePrecheck = safePreviewWritePrecheck;
  state.latestManualConfirmationSafePreviewWriteProjection = safePreviewWriteProjection;
  state.latestManualFormalWriteExecutionPrecheck = formalWriteExecutionPrecheck;
  state.latestManualFormalWriteExecutionPacket = formalWriteExecutionPacket;
  state.latestManualFormalWritePostExecutionAcceptance = formalWritePostExecutionAcceptance;
  state.latestPiEngineExecutionPositionAudit = piEngineExecutionPositionAudit;
  state.latestFormalWriteFollowUpPlan = formalWriteFollowUpPlan;
  return readiness;
}

function syncManualConfirmationSafePreviewWriteButton(panel) {
  const phraseInput = panel?.querySelector("[data-safe-preview-write-phrase]");
  const submitButton = panel?.querySelector("[data-safe-preview-write-submit]");

  if (!phraseInput || !submitButton || phraseInput.disabled) {
    return;
  }

  const matched = String(phraseInput.value || "").trim() === "确认写入安全预览确认块";
  submitButton.disabled = !matched;
  submitButton.setAttribute("aria-disabled", matched ? "false" : "true");
}

function syncManualFormalWriteButton(panel) {
  const phraseInput = panel?.querySelector("[data-formal-write-confirm-phrase]");
  const submitButton = panel?.querySelector("[data-formal-write-submit]");

  if (!phraseInput || !submitButton || phraseInput.disabled) {
    return;
  }

  const matched = String(phraseInput.value || "").trim() === "确认执行正式写回";
  submitButton.disabled = !matched;
  submitButton.setAttribute("aria-disabled", matched ? "false" : "true");
}

function focusDashboardNextStep(dom) {
  requestAnimationFrame(() => {
    const nextStepCard = dom.batchReviewDashboardResult.querySelector(
      "[data-review-next-step-card]",
    );

    if (!nextStepCard) {
      return;
    }

    nextStepCard.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function focusDirectionCards(dom) {
  requestAnimationFrame(() => {
    reveal(dom.analysisPanel);
    dom.cardsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusSampleResult(dom) {
  requestAnimationFrame(() => {
    reveal(dom.samplePanel);
    dom.sampleResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusAnalyzeField(dom, fieldName) {
  requestAnimationFrame(() => {
    const field = fieldName ? dom.analyzeForm.elements[fieldName] : null;

    if (!field) {
      dom.analyzeForm.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus();
  });
}

function focusRefineFeedbackInput(dom) {
  requestAnimationFrame(() => {
    reveal(dom.refinePanel);
    dom.refinePanel.scrollIntoView({ behavior: "smooth", block: "start" });

    if (dom.refineForm.feedback) {
      dom.refineForm.feedback.focus();
    }
  });
}

function focusActionWorkspaceInputs(dom) {
  requestAnimationFrame(() => {
    reveal(dom.actionWorkspacePanel);
    dom.actionWorkspacePanel.scrollIntoView({ behavior: "smooth", block: "start" });

    const firstWorkspaceInput = dom.actionWorkspaceForm.querySelector("textarea, input");

    if (firstWorkspaceInput) {
      firstWorkspaceInput.focus();
    }
  });
}

function focusRealCaseForm(dom) {
  requestAnimationFrame(() => {
    dom.realCaseForm.scrollIntoView({ behavior: "smooth", block: "start" });

    const firstRealCaseInput = dom.realCaseForm.querySelector("textarea, input");

    if (firstRealCaseInput) {
      firstRealCaseInput.focus();
    }
  });
}

function focusRealCaseLibraryResult(dom) {
  requestAnimationFrame(() => {
    dom.realCaseLibraryResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusPlatformCaseSummary(summaryElement) {
  requestAnimationFrame(() => {
    summaryElement.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusRealCasePreviewResult(dom) {
  requestAnimationFrame(() => {
    dom.realCasePreviewResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusRealCaseCommitResult(dom) {
  requestAnimationFrame(() => {
    dom.realCaseCommitResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusRealCaseBatchForm(dom) {
  requestAnimationFrame(() => {
    dom.realCaseBatchForm.scrollIntoView({ behavior: "smooth", block: "start" });

    const firstBatchInput = dom.realCaseBatchForm.querySelector("textarea, input");

    if (firstBatchInput) {
      firstBatchInput.focus();
    }
  });
}

function focusRealCaseBatchPreviewResult(dom) {
  requestAnimationFrame(() => {
    dom.realCaseBatchPreviewResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusRealCaseBatchCommitResult(dom) {
  requestAnimationFrame(() => {
    dom.realCaseBatchCommitResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusRealCaseBatchWorksheetResult(dom) {
  requestAnimationFrame(() => {
    dom.realCaseBatchWorksheetResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusRealCaseBatchRunRecordResult(dom) {
  requestAnimationFrame(() => {
    dom.realCaseBatchRunRecordResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusUiOptimizationReadinessResult(dom) {
  requestAnimationFrame(() => {
    dom.uiOptimizationReadinessResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusBatchRunFrictionSummaryResult(dom) {
  requestAnimationFrame(() => {
    dom.batchRunFrictionSummaryResult.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function focusFormalWriteStatusPanel(dom) {
  requestAnimationFrame(() => {
    const statusPanel = dom.batchReviewDashboardResult.querySelector(
      "[data-formal-write-status-panel]",
    );

    if (!statusPanel) {
      focusDashboardNextStep(dom);
      return;
    }

    statusPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function focusFormalWriteFollowUpPanel(dom) {
  requestAnimationFrame(() => {
    const followUpPanel = dom.batchReviewDashboardResult.querySelector(
      "[data-formal-write-followup-panel]",
    );

    if (!followUpPanel) {
      focusDashboardNextStep(dom);
      return;
    }

    followUpPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function createApp() {
  const dom = getDomRefs();
  const state = createState();

  function syncProductView() {
    dom.productViewPanels.forEach((panel) => {
      const isActive = panel.dataset.productView === state.currentProductView;
      panel.classList.toggle("product-view-active", isActive);
      panel.hidden = !isActive;
    });

    dom.productViewSwitch
      .querySelectorAll("button[data-product-view-target]")
      .forEach((button) => {
        const isActive = button.dataset.productViewTarget === state.currentProductView;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
  }

  function switchProductView(viewId, targetSelector = "", block = "start") {
    state.currentProductView = viewId;
    syncProductView();

    if (!targetSelector) {
      return;
    }

    requestAnimationFrame(() => {
      document.querySelector(targetSelector)?.scrollIntoView({ behavior: "smooth", block });
    });
  }

  function getProductViewTargetSelector(viewId) {
    const targetSelectors = {
      creation: "#product-view-creation",
      review: "#product-view-review",
      writeback: "#product-view-writeback",
    };

    return targetSelectors[viewId] || "#product-view-creation";
  }

  function syncWorkspaceGroupToggle(groupName, expanded) {
    const section = document.querySelector(`[data-workspace-group="${groupName}"]`);
    const button = document.querySelector(
      `button[data-workspace-group-toggle="${groupName}"]`,
    );

    if (!section || !button) {
      return;
    }

    section.classList.toggle("workspace-group-collapsed", !expanded);
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
    button.textContent = expanded ? "收起这组工具" : "展开这组工具";
  }

  function syncProductViewWorkspaceState(viewId) {
    if (viewId === "review") {
      syncWorkspaceGroupToggle("cases", true);
    }

    if (viewId === "writeback") {
      syncWorkspaceGroupToggle("validation", true);
    }
  }

  function openWorkspaceGroupTarget(groupName, targetSelector, block = "start") {
    syncWorkspaceGroupToggle(groupName, true);
    requestAnimationFrame(() => {
      document.querySelector(targetSelector)?.scrollIntoView({ behavior: "smooth", block });
    });
  }

  async function enterCaseReviewWorkspace(targetSelector = "#real-case-form") {
    switchProductView("review");
    openWorkspaceGroupTarget("cases", targetSelector);
    setStatus(dom.realCaseBatchStatus, "正在读取案例状态...");
    state.availableCases = [];

    try {
      await refreshRealCaseLibrary();
      setStatus(dom.realCaseBatchStatus, "案例状态已更新，可继续查看缺口或生成复盘材料。");
    } catch {
      setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
      focusRealCaseLibraryResult(dom);
    }
  }

  async function loadCaseIntoMainWorkbench(caseId) {
    setStatus(dom.realCaseBatchStatus, "正在加载真实案例到主工作台...");
    const payload = await runAvailableCase(caseId);

    patchFormValues(dom.analyzeForm, payload.analysis.fields);
    state.latestAnalysis = payload.analysis;
    state.selectedCardId = null;
    state.latestTitleSelection = null;
    state.latestTitleWritebackApply = null;
    state.selectedWorkspaceId = "";
    state.latestRefinement = null;
    state.latestWorkspaceResult = null;
    state.latestWorkspaceDecisionSave = null;
    dom.secondRoundResult.innerHTML = "";
    renderAnalysisOverview(dom.analysisSummary, dom.analysisMeta, state.latestAnalysis);
    syncWorkspaceUi(dom, state);
    syncSelectionUi(dom, state);
    reveal(dom.analysisPanel);
    reveal(dom.promptPanel);
    hide(dom.secondRoundPanel);
    hide(dom.refinePanel);
    switchProductView("creation");
    focusDirectionCards(dom);
    setStatus(dom.firstRoundStatus, "真实案例已加载到主工作台，可选择方向卡并进入工作区或第二轮。");
    setStatus(dom.realCaseBatchStatus, "真实案例已进入主工作台。");
  }

  async function generateBatchReviewDashboardPreview() {
    try {
      setStatus(dom.realCaseBatchStatus, "正在生成批次复盘看板...");
      const [dashboardPreview] = await Promise.all([
        previewBatchReviewDashboard(),
        refreshFormalWriteGateEvidence(state).catch(() => null),
      ]);
      state.latestBatchReviewDashboardPreview = dashboardPreview;
      state.latestBatchReviewDashboardExport = null;
      state.followUpActionStatus = {};
      renderWritebackGateStatusFromState(dom, state);
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(state, state.latestBatchReviewDashboardPreview),
      );
      setStatus(dom.realCaseBatchStatus, "已生成批次复盘看板。");
      focusDashboardNextStep(dom);
      return true;
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批次复盘看板生成失败。",
      );
      focusDashboardNextStep(dom);
      return false;
    }
  }

  async function enterBatchReviewDashboardWorkspace(targetSelector = "#review-dashboard-section") {
    switchProductView("writeback");
    openWorkspaceGroupTarget("validation", targetSelector);
    await generateBatchReviewDashboardPreview();
  }

  function resolveProductViewForHash(hash) {
    if (!hash || !hash.startsWith("#")) {
      return "";
    }

    const target = document.querySelector(hash);
    if (!target) {
      return "";
    }

    return target.closest("[data-product-view]")?.dataset.productView || "";
  }

  function restoreProductViewFromHash(hash = window.location.hash) {
    const targetSelector = hash || "";

    if (targetSelector === "#real-case-form") {
      void enterCaseReviewWorkspace(targetSelector);
      return true;
    }

    if (targetSelector === "#review-dashboard-section") {
      void enterBatchReviewDashboardWorkspace(targetSelector);
      return true;
    }

    const viewId = resolveProductViewForHash(targetSelector);
    if (!viewId) {
      return false;
    }

    syncProductViewWorkspaceState(viewId);
    switchProductView(viewId, targetSelector);
    return true;
  }

  dom.productViewSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-product-view-target]");
    if (!button) {
      return;
    }

    const viewId = button.dataset.productViewTarget || "creation";
    const targetSelector = getProductViewTargetSelector(viewId);
    if (window.location.hash !== targetSelector) {
      window.location.hash = targetSelector;
      return;
    }

    syncProductViewWorkspaceState(viewId);
    switchProductView(viewId, targetSelector);
  });

  document.querySelectorAll("a[data-product-view-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const viewId = link.dataset.productViewLink || "";
      const targetSelector = link.getAttribute("href") || "";

      if (!viewId || !targetSelector.startsWith("#")) {
        return;
      }

      event.preventDefault();
      switchProductView(viewId, targetSelector);
    });
  });

  document.querySelectorAll("button[data-workspace-group-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupName = button.dataset.workspaceGroupToggle || "";
      const section = document.querySelector(`[data-workspace-group="${groupName}"]`);

      if (!groupName || !section) {
        return;
      }

      const shouldExpand = section.classList.contains("workspace-group-collapsed");
      syncWorkspaceGroupToggle(groupName, shouldExpand);
    });
  });

  document.querySelectorAll("a[data-workspace-group-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const groupName = link.dataset.workspaceGroupLink || "";
      const targetSelector = link.getAttribute("href") || "";

      if (!groupName || !targetSelector.startsWith("#")) {
        return;
      }

      event.preventDefault();
      if (groupName === "cases") {
        void enterCaseReviewWorkspace(targetSelector);
        return;
      }

      if (groupName === "validation" && targetSelector === "#review-dashboard-section") {
        void enterBatchReviewDashboardWorkspace(targetSelector);
        return;
      }

      if (groupName === "validation") {
        switchProductView("writeback");
      }

      if (groupName === "tools") {
        switchProductView("creation");
      }

      openWorkspaceGroupTarget(groupName, targetSelector);
    });
  });

  window.addEventListener("hashchange", () => {
    restoreProductViewFromHash();
  });

  syncProductView();
  syncWorkspaceGroupToggle("tools", false);
  syncWorkspaceGroupToggle("cases", true);
  syncWorkspaceGroupToggle("validation", false);
  restoreProductViewFromHash();
  void refreshRealCaseQuickStart().catch(() => {
    renderRealCaseQuickStart(dom.realCaseQuickStartResult, []);
  });

  dom.analyzeForm.addEventListener("input", () => {
    clearAnalyzeValidation(dom.analyzeForm);
  });

  dom.refineForm.addEventListener("input", () => {
    clearRefineValidation(dom.refineForm);
  });

  async function ensureSampleCases() {
    if (state.sampleCases.length > 0) {
      return state.sampleCases;
    }

    const payload = await loadSampleCases();
    state.sampleCases = payload.items || [];
    return state.sampleCases;
  }

  async function ensureAvailableCases() {
    if (state.availableCases.length > 0) {
      return state.availableCases;
    }

    const payload = await loadAvailableCases();
    state.availableCases = payload.items || [];
    return state.availableCases;
  }

  async function refreshRealCaseLibrary() {
    const cases = await ensureAvailableCases();
    renderRealCaseLibrary(
      dom.realCaseLibraryResult,
      cases,
      state.latestRealCaseCommit?.id || "",
      state.realCaseLaneFilter,
    );
  }

  async function refreshRealCaseQuickStart() {
    const cases = await ensureAvailableCases();
    renderRealCaseQuickStart(dom.realCaseQuickStartResult, cases);
  }

  dom.loadRealCaseTemplateButton.addEventListener("click", () => {
    patchRealCaseTemplate(dom.realCaseForm);
    setStatus(dom.realCaseStatus, "已填入真实案例默认模板，可继续修改后预览。");
  });

  dom.loadRealCaseBatchTemplateButton.addEventListener("click", () => {
    patchRealCaseBatchTemplate(dom.realCaseBatchForm);
    setStatus(dom.realCaseBatchStatus, "已填入批量真实案例模板，可继续修改后预览。");
  });

  dom.previewRealCaseButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseStatus, "正在预览真实案例骨架...");
      state.latestRealCasePreview = await previewRealCaseScaffold(buildRealCasePayload(dom));
      renderRealCasePreview(dom.realCasePreviewResult, state.latestRealCasePreview);
      state.latestRealCaseCommit = null;
      renderRealCaseCommitResult(dom.realCaseCommitResult, null);
      setStatus(dom.realCaseStatus, "已生成真实案例骨架预览，可继续修改表单再次预览。");
      focusRealCasePreviewResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseStatus,
        error instanceof Error ? error.message : "真实案例骨架预览失败，请检查后重试。",
      );
      focusRealCaseForm(dom);
    }
  });

  dom.commitRealCaseButton.addEventListener("click", async () => {
    if (!state.latestRealCasePreview) {
      setStatus(dom.realCaseStatus, "请先预览真实案例骨架，再确认写入。");
      focusRealCasePreviewResult(dom);
      return;
    }

    try {
      setStatus(dom.realCaseStatus, "正在写入真实案例文件...");
      state.latestRealCaseCommit = await commitRealCaseScaffold(buildRealCasePayload(dom));
      state.latestRealCasePreview = state.latestRealCaseCommit;
      renderRealCasePreview(dom.realCasePreviewResult, state.latestRealCasePreview);
      renderRealCaseCommitResult(dom.realCaseCommitResult, state.latestRealCaseCommit);
      state.availableCases = [];
      await refreshRealCaseLibrary();
      setStatus(dom.realCaseStatus, "真实案例已写入，可继续补内容字段并纳入维护链。");
      focusRealCaseCommitResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseStatus,
        error instanceof Error ? error.message : "真实案例写入失败，请检查后重试。",
      );
      focusRealCasePreviewResult(dom);
    }
  });

  dom.previewRealCaseBatchButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在预览批量真实案例骨架...");
      state.latestRealCaseBatchPreview = await previewRealCaseBatchScaffold(
        buildRealCaseBatchPayload(dom),
      );
      state.latestRealCaseBatchCommit = null;
      renderRealCaseBatchPreview(
        dom.realCaseBatchPreviewResult,
        state.latestRealCaseBatchPreview,
      );
      renderRealCaseBatchCommitResult(dom.realCaseBatchCommitResult, null);
      state.latestRealCaseBatchWorksheetPreview = null;
      state.latestRealCaseBatchWorksheetExport = null;
      state.latestRealCaseBatchRunRecordPreview = null;
      state.latestRealCaseBatchRunRecordExport = null;
      state.latestUiOptimizationReadinessPreview = null;
      state.latestUiOptimizationReadinessExport = null;
      state.latestBatchRunFrictionSummaryPreview = null;
      state.latestBatchRunFrictionSummaryExport = null;
      state.latestBatchReviewDashboardPreview = null;
      state.latestBatchReviewDashboardExport = null;
      state.latestBatchReviewSuiteExport = null;
      state.latestFormalWriteReadiness = null;
      state.latestFormalWriteExport = null;
      state.followUpActionStatus = {};
      renderRealCaseBatchWorksheetResult(dom.realCaseBatchWorksheetResult, null);
      renderRealCaseBatchRunRecordResult(dom.realCaseBatchRunRecordResult, null);
      renderUiOptimizationReadinessResult(dom.uiOptimizationReadinessResult, null);
      renderBatchRunFrictionSummaryResult(dom.batchRunFrictionSummaryResult, null);
      renderWritebackGateStatusFromState(dom, state);
      renderBatchReviewDashboardResult(dom.batchReviewDashboardResult, null);
      setStatus(
        dom.realCaseBatchStatus,
        "已生成批量预览，可检查批次结构后再统一确认写入。",
      );
      focusRealCaseBatchPreviewResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批量预览失败。",
      );
      focusRealCaseBatchForm(dom);
    }
  });

  dom.commitRealCaseBatchButton.addEventListener("click", async () => {
    if (!state.latestRealCaseBatchPreview) {
      setStatus(dom.realCaseBatchStatus, "请先预览批量真实案例骨架，再确认写入。");
      focusRealCaseBatchPreviewResult(dom);
      return;
    }

    try {
      setStatus(dom.realCaseBatchStatus, "正在批量写入真实案例文件...");
      state.latestRealCaseBatchCommit = await commitRealCaseBatchScaffold(
        buildRealCaseBatchPayload(dom),
      );
      state.latestRealCaseBatchPreview = {
        created: state.latestRealCaseBatchCommit.created,
        nextIndex: state.latestRealCaseBatchCommit.nextIndex,
        validationSummary: state.latestRealCaseBatchCommit.validationSummary,
      };
      renderRealCaseBatchPreview(
        dom.realCaseBatchPreviewResult,
        state.latestRealCaseBatchPreview,
      );
      renderRealCaseBatchCommitResult(
        dom.realCaseBatchCommitResult,
        state.latestRealCaseBatchCommit,
      );
      state.availableCases = [];
      await refreshRealCaseLibrary();
      setStatus(dom.realCaseBatchStatus, "批量真实案例已写入，可继续进入维护链。");
      focusRealCaseBatchCommitResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批量写入失败。",
      );
      focusRealCaseBatchPreviewResult(dom);
    }
  });

  dom.previewRealCaseBatchWorksheetButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在生成批量回填工作单预览...");
      state.latestRealCaseBatchWorksheetPreview = await previewRealCaseBatchFillWorksheet(
        buildRealCaseBatchPayload(dom),
      );
      state.latestRealCaseBatchWorksheetExport = null;
      state.latestRealCaseBatchWorksheetHistory = null;
      renderRealCaseBatchWorksheetResult(
        dom.realCaseBatchWorksheetResult,
        state.latestRealCaseBatchWorksheetPreview,
      );
      setStatus(dom.realCaseBatchStatus, "已生成批量回填工作单预览，可继续导出到 Obsidian。");
      focusRealCaseBatchWorksheetResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批量工作单预览失败。",
      );
      focusRealCaseBatchForm(dom);
    }
  });

  dom.exportRealCaseBatchWorksheetButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在导出批量回填工作单到 Obsidian...");
      state.latestRealCaseBatchWorksheetExport = await exportRealCaseBatchFillWorksheet(
        buildRealCaseBatchPayload(dom),
      );
      state.latestRealCaseBatchWorksheetHistory = state.latestRealCaseBatchWorksheetExport.history;
      renderRealCaseBatchWorksheetResult(
        dom.realCaseBatchWorksheetResult,
        {
          ...state.latestRealCaseBatchWorksheetPreview,
          ...state.latestRealCaseBatchWorksheetExport,
        },
      );
      setStatus(dom.realCaseBatchStatus, "批量回填工作单已导出到 Obsidian。");
      focusRealCaseBatchWorksheetResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批量工作单导出失败。",
      );
      focusRealCaseBatchWorksheetResult(dom);
    }
  });

  dom.loadRealCaseBatchWorksheetHistoryButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在读取这批案例最近的工作单导出记录...");
      const historyResult = await loadRealCaseBatchFillWorksheetHistory(
        buildRealCaseBatchPayload(dom),
      );
      state.latestRealCaseBatchWorksheetHistory = historyResult;
      renderRealCaseBatchWorksheetResult(
        dom.realCaseBatchWorksheetResult,
        {
          ...state.latestRealCaseBatchWorksheetPreview,
          ...state.latestRealCaseBatchWorksheetExport,
          ...historyResult,
        },
      );
      setStatus(dom.realCaseBatchStatus, "已读取这批案例最近的工作单导出记录。");
      focusRealCaseBatchWorksheetResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "读取批量工作单记录失败。",
      );
      focusRealCaseBatchWorksheetResult(dom);
    }
  });

  dom.previewRealCaseBatchRunRecordButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在生成批次试跑记录预览...");
      state.latestRealCaseBatchRunRecordPreview = await previewRealCaseBatchRunRecord(
        buildRealCaseBatchPayload(dom),
      );
      state.latestRealCaseBatchRunRecordExport = null;
      renderRealCaseBatchRunRecordResult(
        dom.realCaseBatchRunRecordResult,
        state.latestRealCaseBatchRunRecordPreview,
      );
      setStatus(dom.realCaseBatchStatus, "已生成批次试跑记录预览，可继续导出到 Obsidian。");
      focusRealCaseBatchRunRecordResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批次试跑记录预览失败。",
      );
      focusRealCaseBatchForm(dom);
    }
  });

  dom.exportRealCaseBatchRunRecordButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在导出批次试跑记录到 Obsidian...");
      state.latestRealCaseBatchRunRecordExport = await exportRealCaseBatchRunRecord(
        buildRealCaseBatchPayload(dom),
      );
      renderRealCaseBatchRunRecordResult(
        dom.realCaseBatchRunRecordResult,
        {
          ...state.latestRealCaseBatchRunRecordPreview,
          ...state.latestRealCaseBatchRunRecordExport,
        },
      );
      setStatus(dom.realCaseBatchStatus, "批次试跑记录已导出到 Obsidian。");
      focusRealCaseBatchRunRecordResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批次试跑记录导出失败。",
      );
      focusRealCaseBatchRunRecordResult(dom);
    }
  });

  dom.previewUiOptimizationReadinessButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在生成 UI 优化进入条件报告预览...");
      state.latestUiOptimizationReadinessPreview = await previewUiOptimizationReadiness();
      state.latestUiOptimizationReadinessExport = null;
      renderUiOptimizationReadinessResult(
        dom.uiOptimizationReadinessResult,
        state.latestUiOptimizationReadinessPreview,
      );
      setStatus(
        dom.realCaseBatchStatus,
        "已生成 UI 优化进入条件报告预览，可继续决定是否导出到 Obsidian。",
      );
      focusUiOptimizationReadinessResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "UI 就绪度预览失败。",
      );
      focusUiOptimizationReadinessResult(dom);
    }
  });

  dom.exportUiOptimizationReadinessButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在导出 UI 优化进入条件报告到 Obsidian...");
      state.latestUiOptimizationReadinessExport = await exportUiOptimizationReadiness();
      renderUiOptimizationReadinessResult(dom.uiOptimizationReadinessResult, {
        ...state.latestUiOptimizationReadinessPreview,
        ...state.latestUiOptimizationReadinessExport,
      });
      setStatus(dom.realCaseBatchStatus, "UI 优化进入条件报告已导出到 Obsidian。");
      focusUiOptimizationReadinessResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "UI 就绪度导出失败。",
      );
      focusUiOptimizationReadinessResult(dom);
    }
  });

  dom.previewBatchRunFrictionSummaryButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在生成跨批次摩擦点汇总预览...");
      state.latestBatchRunFrictionSummaryPreview = await previewBatchRunFrictionSummary();
      state.latestBatchRunFrictionSummaryExport = null;
      renderBatchRunFrictionSummaryResult(
        dom.batchRunFrictionSummaryResult,
        state.latestBatchRunFrictionSummaryPreview,
      );
      setStatus(dom.realCaseBatchStatus, "已生成跨批次摩擦点汇总预览。");
      focusBatchRunFrictionSummaryResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "跨批次摩擦点汇总预览失败。",
      );
      focusBatchRunFrictionSummaryResult(dom);
    }
  });

  dom.exportBatchRunFrictionSummaryButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在导出跨批次摩擦点汇总到 Obsidian...");
      state.latestBatchRunFrictionSummaryExport = await exportBatchRunFrictionSummary();
      renderBatchRunFrictionSummaryResult(dom.batchRunFrictionSummaryResult, {
        ...state.latestBatchRunFrictionSummaryPreview,
        ...state.latestBatchRunFrictionSummaryExport,
      });
      setStatus(dom.realCaseBatchStatus, "跨批次摩擦点汇总已导出到 Obsidian。");
      focusBatchRunFrictionSummaryResult(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "跨批次摩擦点汇总导出失败。",
      );
      focusBatchRunFrictionSummaryResult(dom);
    }
  });

  dom.previewBatchReviewDashboardButton.addEventListener("click", () => {
    void generateBatchReviewDashboardPreview();
  });

  dom.exportBatchReviewDashboardButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在导出批次复盘看板到 Obsidian...");
      state.latestBatchReviewDashboardExport = await exportBatchReviewDashboard();
      state.latestBatchReviewSuiteExport = null;
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(state, {
          ...state.latestBatchReviewDashboardPreview,
          ...state.latestBatchReviewDashboardExport,
        }),
      );
      setStatus(dom.realCaseBatchStatus, "批次复盘看板已导出到 Obsidian。");
      focusDashboardNextStep(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "批次复盘看板导出失败。",
      );
      focusDashboardNextStep(dom);
    }
  });

  dom.exportBatchReviewSuiteButton.addEventListener("click", async () => {
    try {
      setStatus(dom.realCaseBatchStatus, "正在一键导出复盘套件到 Obsidian...");
      state.latestBatchReviewSuiteExport = await exportBatchReviewSuite();
      state.latestBatchReviewDashboardExport = state.latestBatchReviewSuiteExport.dashboardExport;
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(state, {
          ...state.latestBatchReviewDashboardPreview,
          ...state.latestBatchReviewSuiteExport.dashboardExport,
          suiteExport: {
            exportId: state.latestBatchReviewSuiteExport.exportId,
            exportedAt: state.latestBatchReviewSuiteExport.exportedAt,
            targetPath: state.latestBatchReviewSuiteExport.targetPath,
            readback: state.latestBatchReviewSuiteExport.readback,
          },
        }),
      );
      setStatus(dom.realCaseBatchStatus, "复盘套件已一键导出到 Obsidian。");
      focusDashboardNextStep(dom);
    } catch (error) {
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "复盘套件导出失败。",
      );
      focusDashboardNextStep(dom);
    }
  });

  function handleReviewFollowupAction(event) {
    const copyButton = event.target.closest("button[data-copy-handoff-confirmation]");
    const adoptionCopyButton = event.target.closest("button[data-copy-adoption-replacements]");
    const safePreviewPhraseCopyButton = event.target.closest(
      "button[data-copy-safe-preview-write-phrase]",
    );
    const formalWritePhraseCopyButton = event.target.closest(
      "button[data-copy-formal-write-phrase]",
    );

    if (copyButton) {
      const panel = copyButton.closest(".manual-confirmation-handoff-panel");
      const confirmationBlock = panel
        ?.querySelector("[data-handoff-confirmation-block]")
        ?.textContent
        ?.trim();

      if (!confirmationBlock) {
        setStatus(dom.realCaseBatchStatus, "确认块暂不可复制。");
        return;
      }

      copyTextToClipboard(confirmationBlock)
        .then(() => {
          setStatus(dom.realCaseBatchStatus, "确认块已复制，可写入安全预览记录。");
        })
        .catch(() => {
          setStatus(dom.realCaseBatchStatus, "复制失败，请从交接包面板手动选取确认块。");
        });
      return;
    }

    if (adoptionCopyButton) {
      const panel = adoptionCopyButton.closest(".manual-confirmation-adoption-packet-panel");
      const replacementText = panel
        ?.querySelector("[data-adoption-replacement-text]")
        ?.textContent
        ?.trim();

      if (!replacementText) {
        setStatus(dom.realCaseBatchStatus, "替换项暂不可复制。");
        return;
      }

      copyTextToClipboard(replacementText)
        .then(() => {
          setStatus(dom.realCaseBatchStatus, "替换项已复制，可用于更新决策记录。");
        })
        .catch(() => {
          setStatus(dom.realCaseBatchStatus, "复制失败，请从操作包面板手动选取替换项。");
        });
      return;
    }

    if (safePreviewPhraseCopyButton) {
      const panel = safePreviewPhraseCopyButton.closest("[data-safe-preview-write-panel]");
      const phraseInput = panel?.querySelector("[data-safe-preview-write-phrase]");
      const confirmationPhrase = "确认写入安全预览确认块";

      if (phraseInput) {
        phraseInput.value = confirmationPhrase;
        phraseInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      syncManualConfirmationSafePreviewWriteButton(panel);

      copyTextToClipboard(confirmationPhrase)
        .then(() => {
          setStatus(dom.realCaseBatchStatus, "确认短语已填入，可继续写入确认块。");
        })
        .catch(() => {
          setStatus(dom.realCaseBatchStatus, phraseInput ? "确认短语已填入。" : "填入失败，请手动输入确认短语。");
        });
      return;
    }

    if (formalWritePhraseCopyButton) {
      const panel = formalWritePhraseCopyButton.closest("[data-formal-write-confirm-panel]");
      const phraseInput = panel?.querySelector("[data-formal-write-confirm-phrase]");
      const confirmationPhrase = "确认执行正式写回";

      if (phraseInput) {
        phraseInput.value = confirmationPhrase;
        phraseInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      syncManualFormalWriteButton(panel);

      copyTextToClipboard(confirmationPhrase)
        .then(() => {
          setStatus(dom.realCaseBatchStatus, "正式写回短语已填入，可继续执行。");
        })
        .catch(() => {
          setStatus(dom.realCaseBatchStatus, phraseInput ? "正式写回短语已填入。" : "填入失败，请手动输入正式写回短语。");
        });
      return;
    }

    const actionButton = event.target.closest("button[data-review-followup-action]");

    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.reviewFollowupAction || "";
    if (action) {
      state.followUpActionStatus[action] = {
        state: "running",
        updatedAt: new Date().toISOString(),
      };
      renderWritebackGateStatusFromState(dom, state);
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(
          state,
          state.latestBatchReviewDashboardExport ||
            state.latestBatchReviewDashboardPreview,
        ),
      );
    }

    if (action === "preview-batch-run-friction-summary") {
      dom.previewBatchRunFrictionSummaryButton.click();
      state.followUpActionStatus[action] = {
        state: "completed",
        updatedAt: new Date().toISOString(),
      };
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(
          state,
          state.latestBatchReviewDashboardExport ||
            state.latestBatchReviewDashboardPreview,
        ),
      );
      focusDashboardNextStep(dom);
      dom.batchRunFrictionSummaryResult.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "preview-ui-optimization-readiness") {
      dom.previewUiOptimizationReadinessButton.click();
      state.followUpActionStatus[action] = {
        state: "completed",
        updatedAt: new Date().toISOString(),
      };
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(
          state,
          state.latestBatchReviewDashboardExport ||
            state.latestBatchReviewDashboardPreview,
        ),
      );
      focusDashboardNextStep(dom);
      dom.uiOptimizationReadinessResult.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "preview-real-case-batch-run-record") {
      dom.previewRealCaseBatchRunRecordButton.click();
      state.followUpActionStatus[action] = {
        state: "completed",
        updatedAt: new Date().toISOString(),
      };
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(
          state,
          state.latestBatchReviewDashboardExport ||
            state.latestBatchReviewDashboardPreview,
        ),
      );
      focusDashboardNextStep(dom);
      dom.realCaseBatchRunRecordResult.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "preview-ui-and-dashboard") {
      dom.previewUiOptimizationReadinessButton.click();
      dom.previewBatchReviewDashboardButton.click();
      state.followUpActionStatus[action] = {
        state: "completed",
        updatedAt: new Date().toISOString(),
      };
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(
          state,
          state.latestBatchReviewDashboardExport ||
            state.latestBatchReviewDashboardPreview,
        ),
      );
      focusDashboardNextStep(dom);
      dom.uiOptimizationReadinessResult.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "export-manual-review-task-card") {
      setStatus(dom.realCaseBatchStatus, "正在导出人工复盘待补任务到 Obsidian...");
      exportBatchReviewManualTaskCard()
        .then(() => {
          state.followUpActionStatus[action] = {
            state: "completed",
            updatedAt: new Date().toISOString(),
          };
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(dom.realCaseBatchStatus, "人工复盘待补任务已导出到 Obsidian。");
          focusDashboardNextStep(dom);
        })
        .catch((error) => {
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "人工复盘待补任务导出失败。",
          );
          focusDashboardNextStep(dom);
        });
      return;
    }

    if (action === "export-manual-review-backfill") {
      setStatus(dom.realCaseBatchStatus, "正在导出人工复盘回流预览到 Obsidian...");
      exportBatchReviewManualBackfill()
        .then(() => {
          state.followUpActionStatus[action] = {
            state: "completed",
            updatedAt: new Date().toISOString(),
          };
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(dom.realCaseBatchStatus, "人工复盘回流预览已导出到 Obsidian。");
          focusDashboardNextStep(dom);
        })
        .catch((error) => {
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "人工复盘回流预览导出失败。",
          );
          focusDashboardNextStep(dom);
        });
      return;
    }

    if (action === "export-manual-review-writeback-draft") {
      setStatus(dom.realCaseBatchStatus, "正在导出真实批次试跑结论写回草稿到 Obsidian...");
      exportBatchReviewManualWritebackDraft()
        .then(() => {
          state.followUpActionStatus[action] = {
            state: "completed",
            updatedAt: new Date().toISOString(),
          };
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(dom.realCaseBatchStatus, "真实批次试跑结论写回草稿已导出到 Obsidian。");
          focusDashboardNextStep(dom);
        })
        .catch((error) => {
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "真实批次试跑结论写回草稿导出失败。",
          );
          focusDashboardNextStep(dom);
        });
      return;
    }

    if (action === "export-manual-review-safe-write") {
      setStatus(dom.realCaseBatchStatus, "正在导出真实批次试跑记录安全写回预览到 Obsidian...");
      exportBatchReviewManualSafeWrite()
        .then(async () => {
          await refreshFormalWriteGateEvidence(state).catch(async () => {
            state.latestFormalWriteReadiness =
              await previewBatchReviewManualFormalWriteReadiness().catch(() => null);
          });
          state.followUpActionStatus[action] = {
            state: "completed",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(dom.realCaseBatchStatus, "真实批次试跑记录安全写回预览已导出到 Obsidian。");
          focusDashboardNextStep(dom);
        })
        .catch((error) => {
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "真实批次试跑记录安全写回预览导出失败。",
          );
          focusDashboardNextStep(dom);
        });
      return;
    }

    if (action === "check-manual-review-formal-write-readiness") {
      setStatus(dom.realCaseBatchStatus, "正在检查正式写回是否已到可执行状态...");
      refreshFormalWriteGateEvidence(state)
        .then((result) => {
          state.followUpActionStatus[action] = {
            state: result.status === "ready-to-formal-write" ? "completed" : "running",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            `正式写回状态：${result.statusLabel}。${result.summary}`,
          );
          focusFormalWriteStatusPanel(dom);
        })
        .catch((error) => {
          state.latestFormalWriteReadiness = null;
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "正式写回状态检查失败。",
          );
          focusFormalWriteStatusPanel(dom);
        });
      return;
    }

    if (action === "apply-manual-confirmation-safe-preview-write") {
      const actionPanel = event.target.closest("[data-safe-preview-write-panel]");
      const phraseInput = actionPanel?.querySelector("[data-safe-preview-write-phrase]");
      const confirmationPhrase = String(phraseInput?.value || "").trim();

      if (confirmationPhrase !== "确认写入安全预览确认块") {
        state.followUpActionStatus[action] = {
          state: "failed",
          updatedAt: new Date().toISOString(),
        };
        renderWritebackGateStatusFromState(dom, state);
        renderBatchReviewDashboardResult(
          dom.batchReviewDashboardResult,
          buildDashboardRenderPayload(
            state,
            state.latestBatchReviewDashboardExport ||
              state.latestBatchReviewDashboardPreview,
          ),
        );
        setStatus(dom.realCaseBatchStatus, "确认短语不匹配，安全预览记录保持不变。");
        focusFormalWriteStatusPanel(dom);
        return;
      }

      setStatus(dom.realCaseBatchStatus, "正在写入安全预览确认块...");
      applyBatchReviewManualConfirmationSafePreviewWrite(confirmationPhrase)
        .then(async (result) => {
          state.latestManualConfirmationSafePreviewWriteApply = result;
          state.followUpActionStatus[action] = {
            state: "completed",
            updatedAt: new Date().toISOString(),
          };
          await refreshFormalWriteGateEvidence(state);
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(dom.realCaseBatchStatus, "安全预览确认块已写入，正式写回门禁已重新检查。");
          focusFormalWriteStatusPanel(dom);
        })
        .catch((error) => {
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "安全预览确认块写入失败。",
          );
          focusFormalWriteStatusPanel(dom);
        });
      return;
    }

    if (action === "export-manual-review-formal-write") {
      const actionPanel = event.target.closest("[data-formal-write-confirm-panel]");
      const phraseInput = actionPanel?.querySelector("[data-formal-write-confirm-phrase]");
      const confirmationPhrase = String(phraseInput?.value || "").trim();
      const formalWriteValidation = validateFormalWriteReadiness(state.latestFormalWriteReadiness);

      if (!formalWriteValidation.ok) {
        state.followUpActionStatus[action] = {
          state: "failed",
          updatedAt: new Date().toISOString(),
        };
        renderWritebackGateStatusFromState(dom, state);
        renderBatchReviewDashboardResult(
          dom.batchReviewDashboardResult,
          buildDashboardRenderPayload(
            state,
            state.latestBatchReviewDashboardExport ||
              state.latestBatchReviewDashboardPreview,
          ),
        );
        setStatus(dom.realCaseBatchStatus, formalWriteValidation.message);
        focusFormalWriteStatusPanel(dom);
        return;
      }

      if (confirmationPhrase !== "确认执行正式写回") {
        state.followUpActionStatus[action] = {
          state: "failed",
          updatedAt: new Date().toISOString(),
        };
        renderWritebackGateStatusFromState(dom, state);
        renderBatchReviewDashboardResult(
          dom.batchReviewDashboardResult,
          buildDashboardRenderPayload(
            state,
            state.latestBatchReviewDashboardExport ||
              state.latestBatchReviewDashboardPreview,
          ),
        );
        setStatus(dom.realCaseBatchStatus, "正式写回短语不匹配，目标记录保持不变。");
        focusFormalWriteStatusPanel(dom);
        return;
      }

      setStatus(dom.realCaseBatchStatus, "正在执行正式写回到真实批次试跑记录...");
      exportBatchReviewManualFormalWrite(confirmationPhrase)
        .then((result) => {
          state.latestFormalWriteExport = result;
          state.latestManualFormalWritePostExecutionAcceptance =
            result.postExecutionAcceptance || state.latestManualFormalWritePostExecutionAcceptance;
          state.followUpActionStatus[action] = {
            state: "completed",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(dom.realCaseBatchStatus, "真实批次试跑记录已完成正式写回。");
          focusFormalWriteFollowUpPanel(dom);
        })
        .catch((error) => {
          state.followUpActionStatus[action] = {
            state: "failed",
            updatedAt: new Date().toISOString(),
          };
          renderWritebackGateStatusFromState(dom, state);
          renderBatchReviewDashboardResult(
            dom.batchReviewDashboardResult,
            buildDashboardRenderPayload(
              state,
              state.latestBatchReviewDashboardExport ||
                state.latestBatchReviewDashboardPreview,
            ),
          );
          setStatus(
            dom.realCaseBatchStatus,
            error instanceof Error ? error.message : "写回失败，请检查后重试",
          );
          focusFormalWriteStatusPanel(dom);
        });
      return;
    }

    if (action === "export-batch-review-suite") {
      dom.exportBatchReviewSuiteButton.click();
      state.followUpActionStatus[action] = {
        state: "completed",
        updatedAt: new Date().toISOString(),
      };
      renderBatchReviewDashboardResult(
        dom.batchReviewDashboardResult,
        buildDashboardRenderPayload(
          state,
          state.latestBatchReviewDashboardExport ||
            state.latestBatchReviewDashboardPreview,
        ),
      );
      focusDashboardNextStep(dom);
      return;
    }

    state.followUpActionStatus[action] = {
      state: "failed",
      updatedAt: new Date().toISOString(),
    };
    renderBatchReviewDashboardResult(
      dom.batchReviewDashboardResult,
      buildDashboardRenderPayload(
        state,
        state.latestBatchReviewDashboardExport ||
          state.latestBatchReviewDashboardPreview,
      ),
    );
    setStatus(dom.realCaseBatchStatus, "当前复盘动作暂不可执行，请选择其他复盘入口。");
    focusDashboardNextStep(dom);
  }

  dom.batchReviewDashboardResult.addEventListener("click", handleReviewFollowupAction);
  dom.writebackGateStatusResult
    .closest("#writeback-gate-overview")
    ?.addEventListener("click", handleReviewFollowupAction);
  const handleSafePreviewPhraseInput = (event) => {
    const phraseInput = event.target.closest("[data-safe-preview-write-phrase]");

    if (!phraseInput) {
      return;
    }

    syncManualConfirmationSafePreviewWriteButton(
      phraseInput.closest("[data-safe-preview-write-panel]"),
    );
  };

  dom.batchReviewDashboardResult.addEventListener("input", handleSafePreviewPhraseInput);
  dom.writebackGateStatusResult
    .closest("#writeback-gate-overview")
    ?.addEventListener("input", handleSafePreviewPhraseInput);
  const handleFormalWritePhraseInput = (event) => {
    const phraseInput = event.target.closest("[data-formal-write-confirm-phrase]");

    if (!phraseInput) {
      return;
    }

    syncManualFormalWriteButton(
      phraseInput.closest("[data-formal-write-confirm-panel]"),
    );
  };

  dom.batchReviewDashboardResult.addEventListener("input", handleFormalWritePhraseInput);
  dom.writebackGateStatusResult
    .closest("#writeback-gate-overview")
    ?.addEventListener("input", handleFormalWritePhraseInput);

  dom.refreshWritebackGateStatusButton.addEventListener("click", async () => {
    const action = "check-manual-review-formal-write-readiness";
    state.followUpActionStatus[action] = {
      state: "running",
      updatedAt: new Date().toISOString(),
    };
    renderWritebackGateStatusFromState(dom, state);
    setStatus(dom.realCaseBatchStatus, "正在刷新正式写回门禁状态...");

    try {
      const result = await refreshFormalWriteGateEvidence(state);
      state.followUpActionStatus[action] = {
        state: result.status === "ready-to-formal-write" ? "completed" : "running",
        updatedAt: new Date().toISOString(),
      };
      renderWritebackGateStatusFromState(dom, state);

      if (state.latestBatchReviewDashboardPreview || state.latestBatchReviewDashboardExport) {
        renderBatchReviewDashboardResult(
          dom.batchReviewDashboardResult,
          buildDashboardRenderPayload(
            state,
            state.latestBatchReviewDashboardExport ||
              state.latestBatchReviewDashboardPreview,
          ),
        );
      }

      setStatus(dom.realCaseBatchStatus, `正式写回状态：${result.statusLabel}。${result.summary}`);
    } catch (error) {
      state.latestFormalWriteReadiness = null;
      state.followUpActionStatus[action] = {
        state: "failed",
        updatedAt: new Date().toISOString(),
      };
      renderWritebackGateStatusFromState(dom, state);
      if (state.latestBatchReviewDashboardPreview || state.latestBatchReviewDashboardExport) {
        renderBatchReviewDashboardResult(
          dom.batchReviewDashboardResult,
          buildDashboardRenderPayload(
            state,
            state.latestBatchReviewDashboardExport ||
              state.latestBatchReviewDashboardPreview,
          ),
        );
      }
      setStatus(
        dom.realCaseBatchStatus,
        error instanceof Error ? error.message : "正式写回门禁状态刷新失败。",
      );
    }
  });

  dom.refreshRealCaseLibraryButton.addEventListener("click", async () => {
    try {
      state.availableCases = [];
      await refreshRealCaseLibrary();
      await refreshRealCaseQuickStart();
    } catch {
      setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
      focusRealCaseLibraryResult(dom);
    }
  });

  dom.realCaseQuickStartResult.addEventListener("click", async (event) => {
    const button = event.target.closest('button[data-real-case-action="load-workbench"]');

    if (!button) {
      return;
    }

    const caseId = button.dataset.caseId || "";
    let cases = [];

    try {
      cases = await ensureAvailableCases();
    } catch {
      setStatus(dom.firstRoundStatus, "案例读取失败，请重试");
      dom.realCaseQuickStartResult.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const selection = validateExistingCaseSelection({ caseId, cases, sourceType: "real" });

    if (!selection.ok) {
      setStatus(dom.firstRoundStatus, selection.message);
      return;
    }

    try {
      await loadCaseIntoMainWorkbench(caseId);
    } catch (error) {
      setStatus(
        dom.firstRoundStatus,
        error instanceof Error ? error.message : "案例加载失败，请重试",
      );
      dom.realCaseQuickStartResult.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  dom.realCaseLibraryResult.addEventListener("click", async (event) => {
    const filterButton = event.target.closest("button[data-real-case-lane-filter]");

    if (filterButton) {
      state.realCaseLaneFilter = filterButton.dataset.realCaseLaneFilter || "all";
      try {
        await refreshRealCaseLibrary();
      } catch {
        setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
        focusRealCaseLibraryResult(dom);
      }
      return;
    }
  });

  dom.realCaseLibraryResult.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-real-case-action]");

    if (!button) {
      return;
    }

    const action = button.dataset.realCaseAction;
    const caseId = button.dataset.caseId || "";
    const exportMode = button.dataset.exportMode || "overwrite";
    const platformCaseId = button.dataset.platformCaseId || "";

    let cases = [];

    try {
      cases = await ensureAvailableCases();
    } catch {
      setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
      focusRealCaseLibraryResult(dom);
      return;
    }

    const selection = validateExistingCaseSelection({ caseId, cases, sourceType: "real" });

    if (!selection.ok) {
      setStatus(dom.realCaseBatchStatus, selection.message);
      return;
    }

    try {
      if (action === "load-workbench") {
        await loadCaseIntoMainWorkbench(caseId);
        return;
      }

      if (action === "sync-preview") {
        if (platformCaseId) {
          dom.platformCaseIdInput.value = platformCaseId;
        }

        const preview = await loadPlatformSyncPreview(caseId);
        renderPlatformSyncPreview(dom.platformSyncSummary, preview);
        dom.platformSyncSummary.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (action === "fill-preview" || action === "fill-sheet") {
        state.latestRealCaseMaintenancePreview = await loadRealCaseFillPreview(caseId);
        state.latestRealCaseExport = null;
        renderRealCaseMaintenancePreview(
          dom.realCaseMaintenanceResult,
          state.latestRealCaseMaintenancePreview,
        );
        renderRealCaseExportResult(dom.realCaseExportResult, null);
        dom.realCaseMaintenanceResult.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (action === "export-obsidian-fill") {
        state.latestRealCaseExport = await exportRealCaseFillToObsidian(caseId, exportMode);
        renderRealCaseExportResult(dom.realCaseExportResult, state.latestRealCaseExport);
        dom.realCaseExportResult.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch {
      setStatus(
        dom.realCaseBatchStatus,
        getCaseReviewActionFailureMessage(action),
      );
    }
  });

  dom.loadPlatformReviewButton.addEventListener("click", async () => {
    try {
      const platformCaseId = dom.platformCaseIdInput.value.trim() || "P-01";
      const review = await loadPlatformReview(platformCaseId);
      renderPlatformReview(dom.platformReviewSummary, review);
    } catch {
      setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
      focusPlatformCaseSummary(dom.platformReviewSummary);
    }
  });

  dom.loadPlatformBatchButton.addEventListener("click", async () => {
    try {
      const review = await loadPlatformBatchReview();
      renderPlatformBatchReview(dom.platformBatchSummary, review);
    } catch {
      setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
      focusPlatformCaseSummary(dom.platformBatchSummary);
    }
  });

  dom.loadPlatformSyncPreviewButton.addEventListener("click", async () => {
    try {
      const cases = await ensureAvailableCases();
      const selected = cases.find((item) => item.sourceType === "real") || cases[0];

      if (!selected) {
        return;
      }

      const preview = await loadPlatformSyncPreview(selected.id);
      renderPlatformSyncPreview(dom.platformSyncSummary, preview);
    } catch {
      setStatus(dom.realCaseBatchStatus, "案例读取失败，请重试");
      focusPlatformCaseSummary(dom.platformSyncSummary);
    }
  });

  dom.loadSampleButton.addEventListener("click", async () => {
    setStatus(dom.firstRoundStatus, "正在加载结构化样例...");

    try {
      const cases = await ensureSampleCases();
      const sample = cases[0];

      if (!sample) {
        setStatus(dom.firstRoundStatus, "当前没有可用样例。");
        return;
      }

      const payload = await runSampleCase(sample.id);
      patchFormValues(dom.analyzeForm, payload.analysis.fields);
      state.latestAnalysis = payload.analysis;
      state.selectedCardId = null;
      state.latestTitleSelection = null;
      state.latestTitleWritebackApply = null;
      state.selectedWorkspaceId = "";
      state.latestRefinement = null;
      state.latestWorkspaceResult = null;
      state.latestWorkspaceDecisionSave = null;
      renderAnalysisOverview(dom.analysisSummary, dom.analysisMeta, state.latestAnalysis);
      syncWorkspaceUi(dom, state);
      syncSelectionUi(dom, state);
      reveal(dom.analysisPanel);
      reveal(dom.promptPanel);
      hide(dom.secondRoundPanel);
      hide(dom.refinePanel);
      setStatus(dom.firstRoundStatus, "样例已加载到输入区，并生成了首轮结果。");
    } catch {
      setStatus(dom.firstRoundStatus, "案例读取失败，请重试");
      focusAnalyzeField(dom, "");
    }
  });

  dom.assetUploadInput.addEventListener("change", async () => {
    const file = dom.assetUploadInput.files?.[0];

    if (!file) {
      clearLocalAsset(dom, state);
      return;
    }

    setStatus(dom.firstRoundStatus, "正在生成本地图片预览...");

    try {
      const nextPreview = await buildAssetPreview(file);
      revokeAssetPreview(state.assetPreview);
      state.assetPreview = nextPreview;
      renderAssetPreview(dom.assetPreviewPanel, dom.assetPreviewContent, dom.clearAssetButton, state.assetPreview);
      setStatus(dom.firstRoundStatus, "本地素材已预览，可继续填写内容并生成方向卡。");
    } catch (error) {
      dom.assetUploadInput.value = "";
      renderAssetPreview(dom.assetPreviewPanel, dom.assetPreviewContent, dom.clearAssetButton, state.assetPreview);
      setStatus(dom.firstRoundStatus, error instanceof Error ? error.message : "图片预览失败。");
    }
  });

  dom.clearAssetButton.addEventListener("click", () => {
    clearLocalAsset(dom, state);
    setStatus(dom.firstRoundStatus, "已清除本地素材预览。");
  });

  dom.runSampleButton.addEventListener("click", async () => {
    try {
      const cases = await ensureAvailableCases();
      const selected = cases[0];

      if (!selected) {
        return;
      }

      const payload = await runAvailableCase(selected.id);
      renderSampleRun(dom.sampleResult, payload);
      reveal(dom.samplePanel);
    } catch {
      setStatus(dom.firstRoundStatus, "案例读取失败，请重试");
      focusSampleResult(dom);
    }
  });

  dom.analyzeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (state.isAnalyzeSubmitting) {
      return;
    }

    const payload = buildAnalyzePayload(dom, state);

    const validation = validateAnalyzePayloadFields(payload);
    applyAnalyzeValidation(dom.analyzeForm, validation);

    if (!validation.ok) {
      setStatus(dom.firstRoundStatus, validation.message);
      focusAnalyzeField(dom, validation.fieldName);
      return;
    }

    state.isAnalyzeSubmitting = true;
    setAnalyzeFormSubmitting(dom.analyzeForm, true);
    setStatus(dom.firstRoundStatus, "正在判断点击机制，并生成 3 个封面方向...");
    state.latestAnalysis = null;
    state.selectedCardId = null;
    state.latestTitleSelection = null;
    state.latestTitleWritebackApply = null;
    state.selectedWorkspaceId = "";
    state.latestRefinement = null;
    state.latestWorkspaceResult = null;
    state.latestWorkspaceDecisionSave = null;
    dom.analysisSummary.innerHTML = "";
    dom.analysisMeta.innerHTML = "";
    syncWorkspaceUi(dom, state);
    syncSelectionUi(dom, state);
    hide(dom.analysisPanel);
    hide(dom.promptPanel);
    hide(dom.secondRoundPanel);
    hide(dom.refinePanel);

    try {
      const analysis = await analyzeCoverDirection(payload);
      const resultValidation = validateAnalysisResultCompleteness(analysis);

      if (!resultValidation.ok) {
        setStatus(dom.firstRoundStatus, resultValidation.message);
        focusDirectionCards(dom);
        return;
      }

      state.latestAnalysis = analysis;
      renderAnalysisOverview(dom.analysisSummary, dom.analysisMeta, state.latestAnalysis);
      syncWorkspaceUi(dom, state);
      syncSelectionUi(dom, state);
      reveal(dom.analysisPanel);
      reveal(dom.promptPanel);
      hide(dom.secondRoundPanel);
      hide(dom.refinePanel);
      setStatus(dom.firstRoundStatus, "已生成 3 个方向卡，请先选一张进入第二轮。");
      focusDirectionCards(dom);
    } catch (error) {
      setStatus(dom.firstRoundStatus, getFirstRoundGenerationFailureMessage(error));
      focusAnalyzeField(dom, "");
    } finally {
      state.isAnalyzeSubmitting = false;
      setAnalyzeFormSubmitting(dom.analyzeForm, false);
    }
  });

  dom.cardsContainer.addEventListener("click", async (event) => {
    const writebackButton = event.target.closest("button[data-title-writeback-apply-card-id]");

    if (writebackButton) {
      const cardId = writebackButton.dataset.titleWritebackApplyCardId || "";
      const confirmationInput = dom.cardsContainer.querySelector(
        `input[data-title-writeback-confirmation="${CSS.escape(cardId)}"]`,
      );
      const confirmationPhrase = String(confirmationInput?.value || "").trim();
      const caseId = String(state.latestAnalysis?.fields?.caseId || "").trim();

      if (!caseId) {
        setStatus(dom.firstRoundStatus, "当前结果缺少真实案例 ID，请先从真实案例库运行案例。");
        return;
      }

      if (!state.latestTitleSelection?.copyReviewDraft || state.latestTitleSelection.cardId !== cardId) {
        setStatus(dom.firstRoundStatus, "请先选择需要写回的优选标题。");
        return;
      }

      writebackButton.disabled = true;
      setStatus(dom.firstRoundStatus, "正在执行标题写回并读回校验。");

      try {
        state.latestTitleWritebackApply = await applyTitleSelectionWriteback({
          caseId,
          confirmationPhrase,
          copyReviewDraft: state.latestTitleSelection.copyReviewDraft,
        });
        syncSelectionUi(dom, state);
        setStatus(dom.firstRoundStatus, "标题写回完成，读回校验已返回。");
      } catch (error) {
        const requestError = classifyRequestError(error);
        setStatus(dom.firstRoundStatus, requestError.message);
      } finally {
        writebackButton.disabled = false;
      }

      return;
    }

    const titleButton = event.target.closest("button[data-title-card-id]");

    if (titleButton && state.latestAnalysis) {
      const nextCardId = titleButton.dataset.titleCardId || "";
      const titleIndex = Number(titleButton.dataset.titleIndex || 0);
      const selectedCard = state.latestAnalysis.cards?.find((card) => card.cardId === nextCardId);
      const titleOptions = Array.isArray(selectedCard?.titleOptionDetails) && selectedCard.titleOptionDetails.length
        ? selectedCard.titleOptionDetails
        : (selectedCard?.titleOptions || []).map((title) => ({
            title,
            sourceLabel: "标题建议",
            styleLabel: "基础模板",
          }));
      const titleOption = titleOptions[titleIndex];
      const titleSelection = buildTitleSelectionDraft({
        card: selectedCard,
        titleOption,
        currentCopyReview: state.latestAnalysis?.fields?.copyReview || {},
      });

      if (!titleSelection) {
        setStatus(dom.firstRoundStatus, "标题候选不可用，请重新生成方向卡。");
        return;
      }

      const shouldInvalidateRefinement = shouldInvalidateRefinementForCardChange({
        currentCardId: state.selectedCardId,
        nextCardId,
        latestRefinement: state.latestRefinement,
      });
      const shouldInvalidateWorkspace = shouldInvalidateWorkspaceForCardChange({
        currentCardId: state.selectedCardId,
        nextCardId,
        latestWorkspaceResult: state.latestWorkspaceResult,
        latestWorkspaceDecisionSave: state.latestWorkspaceDecisionSave,
      });

      state.selectedCardId = nextCardId;
      state.selectedWorkspaceId = "";
      state.latestTitleSelection = titleSelection;
      state.latestTitleWritebackApply = null;

      if (shouldInvalidateRefinement) {
        state.latestRefinement = null;
        dom.secondRoundResult.innerHTML = "";
        hide(dom.secondRoundPanel);
      }

      if (shouldInvalidateWorkspace) {
        clearWorkspaceResultState(dom, state);
      }

      syncSelectionUi(dom, state);
      syncWorkspaceUi(dom, state);
      reveal(dom.refinePanel);
      setStatus(dom.firstRoundStatus, "人工优选标题草稿已生成，可继续填写第二轮反馈。");
      return;
    }

    const button = event.target.closest("button[data-card-id]");
    if (!button || !state.latestAnalysis) {
      return;
    }

    const nextCardId = button.dataset.cardId;
    const shouldInvalidateRefinement = shouldInvalidateRefinementForCardChange({
      currentCardId: state.selectedCardId,
      nextCardId,
      latestRefinement: state.latestRefinement,
    });
    const shouldInvalidateWorkspace = shouldInvalidateWorkspaceForCardChange({
      currentCardId: state.selectedCardId,
      nextCardId,
      latestWorkspaceResult: state.latestWorkspaceResult,
      latestWorkspaceDecisionSave: state.latestWorkspaceDecisionSave,
    });

    state.selectedCardId = nextCardId;
    state.selectedWorkspaceId = "";

    if (state.latestTitleSelection?.cardId !== nextCardId) {
      state.latestTitleSelection = null;
      state.latestTitleWritebackApply = null;
    }

    if (shouldInvalidateRefinement) {
      state.latestRefinement = null;
      dom.secondRoundResult.innerHTML = "";
      hide(dom.secondRoundPanel);
      setStatus(dom.firstRoundStatus, "已切换封面方向，原二轮结果已失效。");
    }

    if (shouldInvalidateWorkspace) {
      clearWorkspaceResultState(dom, state);
      setStatus(dom.firstRoundStatus, "已切换封面方向，原工作区建议已失效。");
    }

    syncSelectionUi(dom, state);
    syncWorkspaceUi(dom, state);
    reveal(dom.refinePanel);
    dom.refinePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  dom.actionWorkspacePaths.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-workspace-id]");

    if (!button || !state.selectedCardId) {
      return;
    }

    const nextWorkspaceId = button.dataset.workspaceId;

    if (!nextWorkspaceId || nextWorkspaceId === state.selectedWorkspaceId) {
      return;
    }

    state.selectedWorkspaceId = nextWorkspaceId;
    clearWorkspaceResultState(dom, state);
    syncWorkspaceUi(dom, state);
    setStatus(dom.firstRoundStatus, "已切换工作区路径，请补充当前路径信息后重新生成建议。");
    focusActionWorkspaceInputs(dom);
  });

  dom.refineForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const contextValidation = validateRefinementContext({
      analysis: state.latestAnalysis,
      selectedCardId: state.selectedCardId,
    });

    if (!contextValidation.ok) {
      setStatus(dom.firstRoundStatus, contextValidation.message);
      focusDirectionCards(dom);
      return;
    }

    if (state.isRefineSubmitting) {
      return;
    }

    const refinePayload = serializeForm(dom.refineForm);
    const validation = validateRefinePayloadFields(refinePayload);
    applyRefineValidation(dom.refineForm, validation);

    if (!validation.ok) {
      setStatus(dom.firstRoundStatus, validation.message);
      focusRefineFeedbackInput(dom);
      return;
    }

    state.isRefineSubmitting = true;
    setRefineFormSubmitting(dom.refineForm, true);
    setStatus(dom.firstRoundStatus, "正在生成第二轮优化结果...");

    try {
      const result = await refineDirection({
        ...refinePayload,
        selectedCardId: state.selectedCardId,
        analysis: state.latestAnalysis,
        workspaceResult: getAcceptedWorkspaceResult(state),
      });
      const resultValidation = validateRefinementResultCompleteness(result);

      if (!resultValidation.ok) {
        setStatus(dom.firstRoundStatus, resultValidation.message);
        focusRefineFeedbackInput(dom);
        return;
      }

      state.latestRefinement = result;
      renderRefinementResult(dom.secondRoundResult, result);
      reveal(dom.secondRoundPanel);
      setStatus(dom.firstRoundStatus, "第二轮优化结果已生成。");
      dom.secondRoundPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setStatus(
        dom.firstRoundStatus,
        error instanceof Error ? error.message : "修订失败，请重试",
      );
      focusRefineFeedbackInput(dom);
    } finally {
      state.isRefineSubmitting = false;
      setRefineFormSubmitting(dom.refineForm, false);
    }
  });

  dom.secondRoundResult.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-refinement-follow-up]");
    if (!button) {
      return;
    }

    const action = button.dataset.refinementFollowUp;

    if (action === "workspace") {
      switchProductView("creation");
      reveal(dom.analysisPanel);
      dom.actionWorkspacePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      setStatus(dom.firstRoundStatus, "已返回工作区，可调整路径信息后重新生成建议。");
      return;
    }

    if (action === "continue") {
      reveal(dom.refinePanel);
      dom.refinePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      requestAnimationFrame(() => {
        dom.refineForm.feedback.focus();
        dom.refineForm.feedback.select();
      });
      return;
    }

    if (action === "record-case") {
      void enterCaseReviewWorkspace("#real-case-form");
      setStatus(dom.realCaseStatus, "已进入案例复盘记录，可继续沉淀当前结果。");
      return;
    }

    if (action === "review-dashboard") {
      void enterBatchReviewDashboardWorkspace("#review-dashboard-section");
    }
  });

  dom.actionWorkspaceForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const contextValidation = validateActionWorkspaceContext({
      analysis: state.latestAnalysis,
      selectedCardId: state.selectedCardId,
    });

    if (!contextValidation.ok) {
      setStatus(dom.firstRoundStatus, contextValidation.message);
      focusDirectionCards(dom);
      return;
    }

    if (state.isActionWorkspaceSubmitting) {
      return;
    }

    const workspaceInputs = serializeForm(dom.actionWorkspaceForm);
    const validation = validateActionWorkspacePayloadFields(workspaceInputs);
    applyActionWorkspaceValidation(dom.actionWorkspaceForm, validation);

    if (!validation.ok) {
      setStatus(dom.firstRoundStatus, validation.message);
      focusActionWorkspaceInputs(dom);
      return;
    }

    const selectedWorkspace = getSelectedActionWorkspace(state);

    state.isActionWorkspaceSubmitting = true;
    setActionWorkspaceSubmitting(dom.actionWorkspaceRunButton, selectedWorkspace, true);
    setStatus(dom.firstRoundStatus, "正在生成工作区建议...");

    try {
      state.latestWorkspaceResult = await runActionWorkspace({
        analysis: state.latestAnalysis,
        selectedCardId: state.selectedCardId,
        workspaceId: selectedWorkspace.workspaceId,
        workspaceInputs,
      });
      renderActionWorkspaceResult(dom.actionWorkspaceResult, state.latestWorkspaceResult);
      state.latestWorkspaceDecisionSave = null;
      renderRefineWorkspaceHint(
        dom.refineWorkspaceHint,
        state.latestWorkspaceResult,
        state.latestWorkspaceDecisionSave,
      );
      renderWorkspaceDecisionStatus(dom.workspaceDecisionStatus, null, true);
      syncWorkspaceDecisionActions(dom, state);
      setStatus(dom.firstRoundStatus, "工作区建议已生成，可标记是否采纳。");
      dom.actionWorkspaceResult.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setStatus(
        dom.firstRoundStatus,
        error instanceof Error ? error.message : "建议生成失败，请重试",
      );
      focusActionWorkspaceInputs(dom);
    } finally {
      state.isActionWorkspaceSubmitting = false;
      setActionWorkspaceSubmitting(dom.actionWorkspaceRunButton, selectedWorkspace, false);
    }
  });

  async function saveWorkspaceDecisionWith(decision) {
    if (!state.latestAnalysis || !state.latestWorkspaceResult?.suggestion) {
      return;
    }

    if (state.isWorkspaceDecisionSubmitting) {
      return;
    }

    state.isWorkspaceDecisionSubmitting = true;
    setWorkspaceDecisionSubmitting(dom, decision, true);
    setStatus(dom.firstRoundStatus, "正在保存工作区反馈状态...");

    try {
      state.latestWorkspaceDecisionSave = await saveWorkspaceDecision({
        decision,
        analysis: state.latestAnalysis,
        workspace: state.latestWorkspaceResult.workspace,
        suggestion: state.latestWorkspaceResult.suggestion,
      });
      renderWorkspaceDecisionStatus(dom.workspaceDecisionStatus, state.latestWorkspaceDecisionSave, true);
      renderRefineWorkspaceHint(
        dom.refineWorkspaceHint,
        state.latestWorkspaceResult,
        state.latestWorkspaceDecisionSave,
      );
      syncWorkspaceDecisionActions(dom, state);
      setStatus(
        dom.firstRoundStatus,
        decision === "accept" ? "工作区建议已采纳，可继续进入第二轮。" : "已标记不采纳，可调整路径信息后重新生成建议。",
      );
      if (state.selectedCardId) {
        reveal(dom.refinePanel);
        dom.refinePanel.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      dom.cardsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      setStatus(
        dom.firstRoundStatus,
        error instanceof Error ? error.message : "工作区反馈状态保存失败，请重试",
      );
      renderWorkspaceDecisionStatus(dom.workspaceDecisionStatus, state.latestWorkspaceDecisionSave, true);
      renderRefineWorkspaceHint(
        dom.refineWorkspaceHint,
        state.latestWorkspaceResult,
        state.latestWorkspaceDecisionSave,
      );
      focusActionWorkspaceInputs(dom);
    } finally {
      state.isWorkspaceDecisionSubmitting = false;
      syncWorkspaceDecisionActions(dom, state);
    }
  }

  dom.workspaceAcceptButton.addEventListener("click", async () => {
    await saveWorkspaceDecisionWith("accept");
  });

  dom.workspaceRejectButton.addEventListener("click", async () => {
    await saveWorkspaceDecisionWith("reject");
  });

  dom.promptPreviewButton.addEventListener("click", async () => {
    if (!state.latestAnalysis) {
      return;
    }

    const preview = await buildPromptPreview(buildPromptPayload(dom, state));
    renderPromptPreview(dom.promptResult, preview);
  });

  dom.llmDraftButton.addEventListener("click", async () => {
    if (!state.latestAnalysis) {
      return;
    }

    const result = await generateLlmDraft(buildPromptPayload(dom, state));
    renderLlmDraft(dom.promptResult, result);
  });

  renderSelectedCardSummary(dom.selectedCardSummary, null, null);
  renderAssetPreview(dom.assetPreviewPanel, dom.assetPreviewContent, dom.clearAssetButton, null);
  renderActionWorkspaceForm(dom.actionWorkspaceFields, dom.actionWorkspaceRunButton, null);
  renderActionWorkspaceResult(dom.actionWorkspaceResult, null);
  renderRefineWorkspaceHint(dom.refineWorkspaceHint, null, null);
  renderWorkspaceDecisionStatus(dom.workspaceDecisionStatus, null, false);
  syncWorkspaceDecisionActions(dom, state);
  renderRealCasePreview(dom.realCasePreviewResult, null);
  renderRealCaseCommitResult(dom.realCaseCommitResult, null);
  renderRealCaseBatchPreview(dom.realCaseBatchPreviewResult, null);
  renderRealCaseBatchCommitResult(dom.realCaseBatchCommitResult, null);
  renderRealCaseBatchWorksheetResult(dom.realCaseBatchWorksheetResult, null);
  renderRealCaseBatchRunRecordResult(dom.realCaseBatchRunRecordResult, null);
  renderUiOptimizationReadinessResult(dom.uiOptimizationReadinessResult, null);
  renderBatchRunFrictionSummaryResult(dom.batchRunFrictionSummaryResult, null);
  renderBatchReviewDashboardResult(dom.batchReviewDashboardResult, null);
  renderRealCaseLibrary(dom.realCaseLibraryResult, [], "");
  renderRealCaseMaintenancePreview(dom.realCaseMaintenanceResult, null);
  window.addEventListener("beforeunload", () => revokeAssetPreview(state.assetPreview));
}
