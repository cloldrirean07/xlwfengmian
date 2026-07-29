import { buildFollowUpProgressSummary } from "./followUpProgress.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineTags(items, emptyText = "待补充") {
  if (!items || items.length === 0) {
    return `<span class="empty-inline">${escapeHtml(emptyText)}</span>`;
  }

  return items
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("");
}

function renderListItems(items, emptyText = "暂无") {
  if (!items || items.length === 0) {
    return `<li>${escapeHtml(emptyText)}</li>`;
  }

  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderChecklistItems(items) {
  if (!items || items.length === 0) {
    return "<li>暂无</li>";
  }

  return items
    .map(
      (item) => `
        <li>
          ${escapeHtml(item.label || "")}
          ${
            item.actionId && item.actionLabel
              ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="${escapeHtml(item.actionId)}">${escapeHtml(item.actionLabel)}</button></div>`
              : ""
          }
        </li>
      `,
    )
    .join("");
}

function renderFollowUpStatus(status) {
  if (!status) {
    return "";
  }

  const label =
    status.state === "completed"
      ? "本轮已执行"
      : status.state === "running"
        ? "执行中"
        : status.state === "failed"
          ? "执行失败"
          : "";

  if (!label) {
    return "";
  }

  return `<span class="tag">${escapeHtml(label)}</span>`;
}

function formatFormalWriteTaskType(taskType) {
  const labels = {
    "rule-revision": "规则修订",
    "key-case-rerun": "关键样例复跑",
  };

  return labels[taskType] || "承接任务";
}

function formatFormalWriteExecutionMode(executionMode) {
  const labels = {
    "manual-review-required": "需人工确认",
  };

  return labels[executionMode] || "待确认";
}

function formatFormalWriteTaskStatus(status) {
  const labels = {
    pending: "待处理",
    completed: "已完成",
    failed: "需复查",
  };

  return labels[status] || "待确认";
}

function renderFormalWriteTaskEvidence(evidence) {
  const items = Array.isArray(evidence)
    ? evidence.filter((item) => String(item || "").trim()).slice(0, 2)
    : [];

  if (items.length === 0) {
    return "";
  }

  return `<div class="micro-copy">依据：${escapeHtml(items.join("；"))}</div>`;
}

function buildWritebackGateProgress(readiness, safeWriteStatus, canProceed) {
  const hasSafeWritePreview = Boolean(safeWriteStatus);
  const safeWriteReadbackOk = Boolean(
    safeWriteStatus?.readbackOk && safeWriteStatus?.matchedExpectedContent,
  );
  const hasManualConfirmation = Boolean(safeWriteStatus?.hasManualConfirmation);
  const manualConfirmationDecision = readiness?.manualConfirmationDecision || null;
  const manualDecisionAdopted = Boolean(
    manualConfirmationDecision?.decisionStatus === "adopt-recommended" &&
      manualConfirmationDecision?.canProceedToSafePreviewWrite,
  );
  const hasManualDecision = Boolean(manualConfirmationDecision);
  const checkedFormalReadiness = Boolean(readiness);

  return [
    {
      index: "01",
      title: "安全预览",
      detail: hasSafeWritePreview
        ? safeWriteReadbackOk
          ? "预览已读回"
          : "预览需复查"
        : "等待生成",
      state: hasSafeWritePreview ? (safeWriteReadbackOk ? "completed" : "attention") : "pending",
    },
    {
      index: "02",
      title: "人工确认",
      detail: hasManualConfirmation ? "结论已填写" : "等待结论",
      state: hasManualConfirmation ? "completed" : hasSafeWritePreview ? "active" : "pending",
    },
    {
      index: "03",
      title: "人工决策",
      detail: manualDecisionAdopted
        ? "推荐块已采用"
        : hasManualDecision
          ? "等待采用"
          : "等待读取",
      state: manualDecisionAdopted ? "completed" : hasSafeWritePreview ? "active" : "pending",
    },
    {
      index: "04",
      title: "状态检查",
      detail: checkedFormalReadiness
        ? canProceed
          ? "门禁已满足"
          : "门禁未满足"
        : "等待检查",
      state: checkedFormalReadiness ? (canProceed ? "completed" : "active") : "pending",
    },
    {
      index: "05",
      title: "正式写回",
      detail: canProceed ? "允许执行" : "保持锁定",
      state: canProceed ? "active" : "locked",
    },
  ];
}

function renderWritebackGateProgress(items) {
  return `
    <ol class="writeback-gate-progress" aria-label="正式写回门禁进度">
      ${items
        .map(
          (item) => `
            <li class="writeback-gate-step writeback-gate-step-${escapeHtml(item.state)}">
              <span class="writeback-gate-step-index">${escapeHtml(item.index)}</span>
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.detail)}</span>
              </div>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

function formatWritebackActionState(status) {
  if (status?.state === "completed") {
    return "已完成";
  }

  if (status?.state === "running") {
    return "执行中";
  }

  if (status?.state === "failed") {
    return "需复查";
  }

  return "未执行";
}

function getWritebackActionRecovery(actionId) {
  const recoveryByAction = {
    "export-manual-review-safe-write": {
      actionId: "export-manual-review-safe-write",
      label: "重新导出安全预览",
    },
    "check-manual-review-formal-write-readiness": {
      actionId: "check-manual-review-formal-write-readiness",
      label: "重新检查写回状态",
    },
    "export-manual-review-formal-write": {
      actionId: "check-manual-review-formal-write-readiness",
      label: "重新检查写回状态",
    },
  };

  return recoveryByAction[actionId] || null;
}

function renderWritebackActionProgress(followUpProgress = {}) {
  const items = [
    {
      actionId: "export-manual-review-safe-write",
      label: "导出安全预览",
      detail: "生成可人工确认的安全写回材料",
    },
    {
      actionId: "check-manual-review-formal-write-readiness",
      label: "检查写回状态",
      detail: "读回安全预览并判断门禁",
    },
    {
      actionId: "export-manual-review-formal-write",
      label: "执行正式写回",
      detail: "门禁满足后写回真实批次记录",
    },
  ];

  return `
    <div class="writeback-action-progress" aria-label="写回操作执行状态">
      ${items
        .map((item) => {
          const status = followUpProgress[item.actionId] || null;
          const state = status?.state || "idle";
          const recovery = state === "failed" ? getWritebackActionRecovery(item.actionId) : null;

          return `
            <div class="writeback-action-progress-item writeback-action-progress-${escapeHtml(state)}">
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(formatWritebackActionState(status))}</strong>
              <small>${escapeHtml(item.detail)}</small>
              ${
                recovery
                  ? `<button type="button" class="ghost-button writeback-action-recovery" data-review-followup-action="${escapeHtml(recovery.actionId)}">${escapeHtml(recovery.label)}</button>`
                  : ""
              }
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function hasWritebackActionProgress(followUpProgress = {}) {
  return [
    "export-manual-review-safe-write",
    "check-manual-review-formal-write-readiness",
    "export-manual-review-formal-write",
  ].some((actionId) => Boolean(followUpProgress[actionId]));
}

function renderWritebackManualConfirmationGuidance(safeWriteStatus, hasManualConfirmation) {
  if (!safeWriteStatus || hasManualConfirmation) {
    return "";
  }

  const safeWritePath = safeWriteStatus.targetPath || "";

  return `
    <div class="writeback-confirmation-guidance" aria-label="人工确认补齐提示">
      <strong>待补人工确认</strong>
      <span>${escapeHtml(safeWritePath || "先导出安全预览，再补齐人工确认。")}</span>
      <small>在安全预览底部填写人工复盘结论后，重新检查写回状态。</small>
      <button type="button" class="ghost-button" data-review-followup-action="check-manual-review-formal-write-readiness">重新检查写回状态</button>
    </div>
  `;
}

function renderManualConfirmationDraftValidation(validation) {
  if (!validation) {
    return "";
  }

  const blocks = Array.isArray(validation.blocks) ? validation.blocks : [];

  return `
    <div class="manual-confirmation-draft-panel" aria-label="人工确认草稿门禁验证">
      <div class="manual-confirmation-draft-head">
        <div>
          <span class="section-kicker">Draft Gate Check</span>
          <strong>人工确认草稿验证</strong>
        </div>
        <span>${escapeHtml(validation.ok ? "验证通过" : "需修正")}</span>
      </div>
      <p>${escapeHtml(validation.summary || "待重新验证人工确认草稿。")}</p>
      ${
        validation.sourcePath
          ? `<small class="manual-confirmation-draft-source">草稿来源：${escapeHtml(validation.sourcePath)}</small>`
          : ""
      }
      <div class="manual-confirmation-draft-grid">
        ${blocks
          .map(
            (block) => `
              <div class="manual-confirmation-draft-card">
                <span>${escapeHtml(block.label || "确认块")}</span>
                <strong>${escapeHtml(block.canProceedToFormalWrite ? "会打开门禁" : "保持锁定")}</strong>
                <dl>
                  <div>
                    <dt>人工结论</dt>
                    <dd>${escapeHtml(block.manualReviewConclusion || block.manualReviewConclusionValidation?.message || "待补")}</dd>
                  </div>
                  <div>
                    <dt>确认行</dt>
                    <dd>${escapeHtml(block.confirmedLines || "待补")}</dd>
                  </div>
                  <div>
                    <dt>仍需手改</dt>
                    <dd>${escapeHtml(block.stillNeedsEdit || "无")}</dd>
                  </div>
                  <div>
                    <dt>写回许可</dt>
                    <dd>${escapeHtml(block.readyDecision || "未填写")}</dd>
                  </div>
                </dl>
              </div>
            `,
          )
          .join("")}
      </div>
      <small>该区域只验证草稿效果，不写入安全预览，也不执行正式写回。</small>
    </div>
  `;
}

function renderManualConfirmationApplyPreview(applyPreview) {
  if (!applyPreview) {
    return "";
  }

  const variants = Array.isArray(applyPreview.variants) ? applyPreview.variants : [];

  return `
    <div class="manual-confirmation-apply-panel" aria-label="人工确认写入前预演">
      <div class="manual-confirmation-apply-head">
        <div>
          <span class="section-kicker">Apply Preview</span>
          <strong>写入前预演</strong>
        </div>
        <span>${escapeHtml(applyPreview.ok ? "预演通过" : "需修正")}</span>
      </div>
      <p>${escapeHtml(applyPreview.summary || "待生成写入前预演。")}</p>
      <small>${escapeHtml(applyPreview.safetyBoundary || "仅展示项目内预演结果。")}</small>
      <div class="manual-confirmation-apply-grid">
        ${variants
          .map(
            (variant) => `
              <div class="manual-confirmation-apply-card">
                <span>${escapeHtml(variant.label || "预演版本")}</span>
                <strong>${escapeHtml(variant.canProceedToFormalWrite ? "合并后可写回" : "合并后保持锁定")}</strong>
                <dl>
                  <div>
                    <dt>预期结果</dt>
                    <dd>${escapeHtml(variant.expectedCanProceedToFormalWrite ? "打开门禁" : "保持锁定")}</dd>
                  </div>
                  <div>
                    <dt>实际结果</dt>
                    <dd>${escapeHtml(variant.canProceedToFormalWrite ? "打开门禁" : "保持锁定")}</dd>
                  </div>
                  <div>
                    <dt>仍需手改</dt>
                    <dd>${escapeHtml(variant.stillNeedsEdit || "无")}</dd>
                  </div>
                  <div>
                    <dt>预演副本</dt>
                    <dd>${escapeHtml(variant.outputPath || "未生成")}</dd>
                  </div>
                </dl>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderManualConfirmationSafePreviewAdoptionPacket(packet) {
  if (!packet) {
    return "";
  }

  const nextChecks = Array.isArray(packet.nextChecks) ? packet.nextChecks : [];

  return `
    <div class="manual-confirmation-apply-panel" aria-label="安全预览确认采用包">
      <div class="manual-confirmation-apply-head">
        <div>
          <span class="section-kicker">Safe Preview Packet</span>
          <strong>安全预览确认采用包</strong>
        </div>
        <span>${escapeHtml(packet.ok ? "可使用" : "需修正")}</span>
      </div>
      <p>${escapeHtml(packet.summary || "待生成安全预览确认采用包。")}</p>
      <small>${escapeHtml(packet.safetyBoundary || "仅展示项目内采用包。")}</small>
      <div class="manual-confirmation-apply-grid">
        <div class="manual-confirmation-apply-card">
          <span>写入目标</span>
          <strong>${escapeHtml(packet.targetBatchLabel || "暂无批次")}</strong>
          <dl>
            <div>
              <dt>安全预览记录</dt>
              <dd>${escapeHtml(packet.targetSafePreviewPath || "暂无")}</dd>
            </div>
            <div>
              <dt>建议版本预演</dt>
              <dd>${escapeHtml(packet.suggestedPreviewPath || "暂无")}</dd>
            </div>
          </dl>
        </div>
        <div class="manual-confirmation-apply-card">
          <span>采用结果</span>
          <strong>${escapeHtml(packet.canProceedToFormalWriteAfterApply ? "应用后可复查正式写回" : "应用后仍保持锁定")}</strong>
          <dl>
            <div>
              <dt>人工决策</dt>
              <dd>${escapeHtml(packet.decisionLabel || "暂无")}</dd>
            </div>
            <div>
              <dt>写回许可</dt>
              <dd>${escapeHtml(packet.readyDecision || "未填写")}</dd>
            </div>
          </dl>
        </div>
      </div>
      <div class="manual-confirmation-decision-box">
        <span>建议确认块</span>
        <strong>${escapeHtml(packet.manualReviewConclusion || "待补人工复盘结论")}</strong>
        <small>${escapeHtml(packet.confirmedLines || "待补确认行")}</small>
      </div>
      <ul class="detail-list">
        ${renderListItems(nextChecks, "当前没有后续复查项。")}
      </ul>
    </div>
  `;
}

function renderManualConfirmationSafePreviewWritePrecheck(precheck, applyResult = null) {
  if (!precheck) {
    return "";
  }

  const fieldChanges = Array.isArray(precheck.fieldChanges) ? precheck.fieldChanges : [];
  const canApply = Boolean(precheck.ok && precheck.status === "safe-preview-write-precheck-ready");
  const canRecheckFormalWrite = Boolean(applyResult?.readback?.ok);
  const confirmationPhrase =
    precheck.confirmation?.requiredPhrase || "确认写入安全预览确认块";
  const nextAction = precheck.nextAction || null;
  const writePlan = precheck.writePlan || null;

  return `
    <div class="manual-confirmation-apply-panel" aria-label="安全预览确认写入预检" data-safe-preview-write-panel>
      <div class="manual-confirmation-apply-head">
        <div>
          <span class="section-kicker">Write Precheck</span>
          <strong>安全预览确认写入预检</strong>
        </div>
        <span>${escapeHtml(precheck.ok ? "预检通过" : "需修正")}</span>
      </div>
      <p>${escapeHtml(precheck.summary || "待生成安全预览确认写入预检。")}</p>
      <small>${escapeHtml(precheck.safetyBoundary || "仅展示项目内预检结果。")}</small>
      <div class="manual-confirmation-apply-grid">
        <div class="manual-confirmation-apply-card">
          <span>写入前</span>
          <strong>${escapeHtml(precheck.before?.canProceedToFormalWrite ? "已可复查" : "保持锁定")}</strong>
          <dl>
            <div>
              <dt>人工确认</dt>
              <dd>${escapeHtml(precheck.before?.hasManualConfirmation ? "已填写" : "待补齐")}</dd>
            </div>
            <div>
              <dt>结论校验</dt>
              <dd>${escapeHtml(precheck.before?.manualReviewConclusionValidation?.ok ? "通过" : precheck.before?.manualReviewConclusionValidation?.message || "待补")}</dd>
            </div>
          </dl>
        </div>
        <div class="manual-confirmation-apply-card">
          <span>写入后</span>
          <strong>${escapeHtml(precheck.after?.canProceedToFormalWrite ? "可复查正式写回" : "仍保持锁定")}</strong>
          <dl>
            <div>
              <dt>人工确认</dt>
              <dd>${escapeHtml(precheck.after?.hasManualConfirmation ? "已填写" : "待补齐")}</dd>
            </div>
            <div>
              <dt>变更字段</dt>
              <dd>${escapeHtml(precheck.changedFieldCount ?? 0)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <ul class="detail-list">
        ${
          fieldChanges.length
            ? fieldChanges
                .map(
                  (item) =>
                    `<li>${escapeHtml(item.label)}：${escapeHtml(item.before || "空")} -> ${escapeHtml(item.after || "空")}</li>`,
                )
                .join("")
            : "<li>当前没有字段变化。</li>"
        }
      </ul>
      <div class="manual-confirmation-controlled-write">
        <div class="manual-confirmation-controlled-write-brief" aria-label="安全预览确认写入执行前确认">
          <div>
            <span>写入目标</span>
            <strong>${escapeHtml(precheck.targetSafePreviewPath || "暂无")}</strong>
          </div>
          <div>
            <span>建议来源</span>
            <strong>${escapeHtml(precheck.suggestedPreviewPath || "暂无")}</strong>
          </div>
          <div>
            <span>推荐动作</span>
            <strong>${escapeHtml(nextAction?.label || "写入安全预览确认块")}</strong>
          </div>
          <div>
            <span>动作短语</span>
            <strong>${escapeHtml(confirmationPhrase)}</strong>
          </div>
          <div>
            <span>内容变化</span>
            <strong>${escapeHtml(writePlan ? `${writePlan.currentContentLength} -> ${writePlan.suggestedContentLength}` : "待生成")}</strong>
          </div>
          <div>
            <span>行数变化</span>
            <strong>${escapeHtml(writePlan ? `${writePlan.currentLineCount} -> ${writePlan.suggestedLineCount}` : "待生成")}</strong>
          </div>
        </div>
        <div>
          <span>受控写入入口</span>
          <strong>${escapeHtml(canApply ? "确认后可写入安全预览记录" : "预检通过后开放")}</strong>
          <small>${escapeHtml(applyResult?.summary || nextAction?.summary || "填写确认短语后，系统会再次执行预检和读回校验。")}</small>
        </div>
        <div class="manual-confirmation-controlled-write-action">
          <input
            type="text"
            data-safe-preview-write-phrase
            placeholder="${escapeHtml(confirmationPhrase)}"
            ${canApply ? "" : "disabled"}
          />
          <button
            type="button"
            class="ghost-button"
            data-copy-safe-preview-write-phrase
            ${canApply ? "" : 'disabled aria-disabled="true"'}
          >
            填入短语
          </button>
          <button
            type="button"
            data-safe-preview-write-submit
            data-review-followup-action="apply-manual-confirmation-safe-preview-write"
            disabled
            aria-disabled="true"
          >
            写入确认块
          </button>
        </div>
        ${
          applyResult
            ? `<p class="micro-copy">${escapeHtml(applyResult.status || "待确认")} · ${escapeHtml(applyResult.readback?.ok ? "读回已通过" : "等待读回校验")}</p>`
            : ""
        }
        <div class="manual-confirmation-controlled-write-checks">
          <div>
            <span>写入后复查</span>
            <strong>${escapeHtml(canRecheckFormalWrite ? "重新检查正式写回门禁" : "写入成功后复查门禁")}</strong>
            <small>目标状态：ready-to-formal-write。达成后仍需单独执行正式写回。</small>
          </div>
          <button
            type="button"
            class="ghost-button"
            data-review-followup-action="check-manual-review-formal-write-readiness"
            ${canRecheckFormalWrite ? "" : 'disabled aria-disabled="true"'}
          >
            复查写回门禁
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderManualConfirmationSafePreviewWriteProjection(projection) {
  if (!projection) {
    return "";
  }

  const blockers = Array.isArray(projection.blockers) ? projection.blockers : [];

  return `
    <div class="manual-confirmation-projection-panel" aria-label="安全预览确认写入后门禁投影">
      <div class="manual-confirmation-projection-head">
        <div>
          <span class="section-kicker">Gate Projection</span>
          <strong>写入后门禁投影</strong>
        </div>
        <span>${escapeHtml(projection.ok ? "投影通过" : "需修正")}</span>
      </div>
      <p>${escapeHtml(projection.summary || "待生成写入后门禁投影。")}</p>
      <small>${escapeHtml(projection.safetyBoundary || "仅展示项目内投影结果。")}</small>
      <div class="manual-confirmation-projection-grid">
        <div>
          <span>预计 readiness</span>
          <strong>${escapeHtml(projection.projectedReadiness?.status || "待确认")}</strong>
        </div>
        <div>
          <span>状态码</span>
          <strong>${escapeHtml(projection.status || "待确认")}</strong>
        </div>
        <div>
          <span>目标批次</span>
          <strong>${escapeHtml(projection.writePrecheck?.targetBatchLabel || "暂无")}</strong>
        </div>
        <div>
          <span>写入后人工确认</span>
          <strong>${escapeHtml(projection.writePrecheck?.hasManualConfirmationAfterApply ? "已具备" : "仍缺失")}</strong>
        </div>
        <div>
          <span>写入后复查</span>
          <strong>${escapeHtml(projection.writePrecheck?.canProceedToFormalWriteAfterApply ? "可进入" : "仍锁定")}</strong>
        </div>
        <div>
          <span>人工决策</span>
          <strong>${escapeHtml(projection.manualDecision?.decisionLabel || "待读取")}</strong>
        </div>
        <div>
          <span>推荐动作</span>
          <strong>${escapeHtml(projection.nextAction?.label || "待确认")}</strong>
        </div>
      </div>
      <div class="manual-confirmation-projection-blockers">
        <strong>投影阻塞点</strong>
        <ul>
          ${
            blockers.length
              ? blockers
                  .map(
                    (item) => `
                      <li>
                        <span>${escapeHtml(item.label || "待复查")}</span>
                        <small>${escapeHtml(item.detail || "待补充")}</small>
                      </li>
                    `,
                  )
                  .join("")
              : "<li><span>当前无阻塞点</span><small>写入后预计可重新检查正式写回门禁。</small></li>"
          }
        </ul>
      </div>
    </div>
  `;
}

function renderFormalWriteControlledAction(canProceed) {
  return `
    <div class="writeback-controlled-action" data-formal-write-confirm-panel>
      <div class="writeback-controlled-action-copy">
        <input
          type="text"
          data-formal-write-confirm-phrase
          placeholder="确认执行正式写回"
          ${canProceed ? "" : "disabled"}
        />
        <button
          type="button"
          class="ghost-button"
          data-copy-formal-write-phrase
          ${canProceed ? "" : 'disabled aria-disabled="true"'}
        >
          填入短语
        </button>
        <button
          type="button"
          data-formal-write-submit
          data-review-followup-action="export-manual-review-formal-write"
          disabled
          aria-disabled="true"
        >
          ${escapeHtml(canProceed ? "执行正式写回" : "正式写回待解锁")}
        </button>
      </div>
      <span>${escapeHtml(canProceed ? "门禁已满足，填入确认短语后仍会再次校验状态。" : "安全预览完成人工确认后才可执行正式写回。")}</span>
    </div>
  `;
}

function renderManualFormalWriteExecutionPrecheck(precheck) {
  if (!precheck) {
    return "";
  }

  const target = precheck.target || {};
  const readiness = precheck.readiness || {};
  const confirmation = precheck.confirmation || {};
  const manualDecision = precheck.manualDecision || {};
  const nextChecks = Array.isArray(precheck.nextChecks) ? precheck.nextChecks : [];
  const blockers = Array.isArray(precheck.blockers) ? precheck.blockers : [];
  const nextAction = precheck.nextAction || null;

  return `
    <div class="manual-formal-write-precheck-panel" aria-label="正式写回执行前预检">
      <div class="manual-formal-write-precheck-head">
        <div>
          <span class="section-kicker">Execution Precheck</span>
          <strong>正式写回执行前预检</strong>
        </div>
        <span>${escapeHtml(precheck.ok ? "预检通过" : "需修正")}</span>
      </div>
      <p>${escapeHtml(precheck.summary || "待生成正式写回执行前预检。")}</p>
      <small>${escapeHtml(precheck.safetyBoundary || "仅展示项目内预检结果。")}</small>
      <div class="manual-formal-write-precheck-grid">
        <div>
          <span>门禁状态</span>
          <strong>${escapeHtml(readiness.statusLabel || readiness.status || "待检查")}</strong>
        </div>
        <div>
          <span>状态码</span>
          <strong>${escapeHtml(precheck.status || "待生成")}</strong>
        </div>
        <div>
          <span>目标批次</span>
          <strong>${escapeHtml(target.batchLabel || "暂无")}</strong>
        </div>
        <div>
          <span>人工决策</span>
          <strong>${escapeHtml(manualDecision.decisionLabel || "待读取")}</strong>
        </div>
        <div>
          <span>目标记录</span>
          <strong>${escapeHtml(target.targetRecordPath || "暂无")}</strong>
        </div>
        <div>
          <span>安全预览</span>
          <strong>${escapeHtml(target.safePreviewPath || "暂无")}</strong>
        </div>
        <div>
          <span>预览读回</span>
          <strong>${escapeHtml(target.readbackOk ? "已确认" : "待确认")}</strong>
        </div>
        <div>
          <span>写回内容</span>
          <strong>${escapeHtml(target.hasPatchedMarkdown ? "已解析" : "待解析")}</strong>
        </div>
        <div>
          <span>确认短语</span>
          <strong>${escapeHtml(confirmation.requiredPhrase || "确认执行正式写回")}</strong>
        </div>
        <div>
          <span>执行许可</span>
          <strong>${escapeHtml(target.canProceedToFormalWrite && precheck.ok ? "短语确认后开放" : "保持锁定")}</strong>
        </div>
      </div>
      <div class="manual-formal-write-blockers" aria-label="正式写回执行前阻塞点">
        <strong>当前阻塞点</strong>
        <ul>
          ${
            blockers.length
              ? blockers
                  .map(
                    (item) => `
                      <li>
                        <span>${escapeHtml(item.label || "待复查")}</span>
                        <small>${escapeHtml(item.detail || "待补充")}</small>
                      </li>
                    `,
                  )
                  .join("")
              : "<li><span>当前无阻塞点</span><small>短语确认后仍会再次校验门禁。</small></li>"
          }
        </ul>
      </div>
      ${
        nextAction
          ? `
            <div class="manual-formal-write-next-action" aria-label="正式写回执行前推荐动作">
              <div>
                <span>推荐动作</span>
                <strong>${escapeHtml(nextAction.label || "待确认")}</strong>
                <small>${escapeHtml(nextAction.summary || "补齐阻塞项后重新检查门禁。")}</small>
              </div>
              ${
                nextAction.requiredPhrase
                  ? `<code>${escapeHtml(nextAction.requiredPhrase)}</code>`
                  : ""
              }
            </div>
          `
          : ""
      }
      <ul class="detail-list">
        ${renderListItems(nextChecks, "当前没有后续检查项。")}
      </ul>
    </div>
  `;
}

function renderManualFormalWriteExecutionPacket(packet) {
  if (!packet) {
    return "";
  }

  const target = packet.target || {};
  const writePlan = packet.writePlan || {};
  const lineDiff = packet.lineDiff || {};
  const rollback = packet.rollback || {};
  const confirmation = packet.confirmation || {};
  const nextChecks = Array.isArray(packet.nextChecks) ? packet.nextChecks : [];
  const diffHunks = Array.isArray(lineDiff.hunks) ? lineDiff.hunks : [];

  return `
    <div class="manual-formal-write-packet-panel" aria-label="正式写回执行包">
      <div class="manual-formal-write-precheck-head">
        <div>
          <span class="section-kicker">Execution Packet</span>
          <strong>正式写回执行包</strong>
        </div>
        <span>${escapeHtml(packet.ok ? "执行包就绪" : "需修正")}</span>
      </div>
      <p>${escapeHtml(packet.summary || "待生成正式写回执行包。")}</p>
      <small>${escapeHtml(packet.safetyBoundary || "仅展示项目内执行包结果。")}</small>
      <div class="manual-formal-write-precheck-grid">
        <div>
          <span>目标批次</span>
          <strong>${escapeHtml(target.batchLabel || "暂无")}</strong>
        </div>
        <div>
          <span>目标记录</span>
          <strong>${escapeHtml(target.targetRecordPath || "暂无")}</strong>
        </div>
        <div>
          <span>状态码</span>
          <strong>${escapeHtml(packet.status || "待生成")}</strong>
        </div>
        <div>
          <span>写入前长度</span>
          <strong>${escapeHtml(writePlan.previousContentLength ?? "暂无")}</strong>
        </div>
        <div>
          <span>写入后长度</span>
          <strong>${escapeHtml(writePlan.finalContentLength ?? "暂无")}</strong>
        </div>
        <div>
          <span>长度变化</span>
          <strong>${escapeHtml(writePlan.contentLengthDelta ?? "暂无")}</strong>
        </div>
        <div>
          <span>行数变化</span>
          <strong>${escapeHtml(writePlan.lineCountDelta ?? "暂无")}</strong>
        </div>
        <div>
          <span>新增行数</span>
          <strong>${escapeHtml(lineDiff.addedLineCount ?? "暂无")}</strong>
        </div>
        <div>
          <span>移除行数</span>
          <strong>${escapeHtml(lineDiff.removedLineCount ?? "暂无")}</strong>
        </div>
        <div>
          <span>差异块数</span>
          <strong>${escapeHtml(lineDiff.hunkCount ?? "暂无")}</strong>
        </div>
        <div>
          <span>确认短语</span>
          <strong>${escapeHtml(confirmation.requiredPhrase || "确认执行正式写回")}</strong>
        </div>
        <div>
          <span>覆盖目标记录</span>
          <strong>${escapeHtml(writePlan.willOverwriteTargetRecord ? "确认后覆盖" : "保持锁定")}</strong>
        </div>
      </div>
      <div class="manual-formal-write-next-action" aria-label="正式写回回滚策略">
        <div>
          <span>回滚策略</span>
          <strong>${escapeHtml(rollback.restoreWhenReadbackMismatch ? "读回不一致时恢复旧版本" : "待配置")}</strong>
          <small>${escapeHtml(rollback.summary || "待生成回滚策略。")}</small>
        </div>
        <code>${escapeHtml(rollback.previousSnapshotPath || "待生成旧版本快照")}</code>
      </div>
      <div class="manual-formal-write-diff" aria-label="正式写回行级差异">
        <strong>行级差异审计</strong>
        <small>${escapeHtml(lineDiff.truncated ? "差异块较多，当前仅展示前几个重点差异。" : "当前展示全部差异块。")}</small>
        <ul>
          ${
            diffHunks.length
              ? diffHunks
                  .map(
                    (hunk) => `
                      <li>
                        <span>${escapeHtml(hunk.hunkId || "差异块")}</span>
                        ${
                          hunk.contextBefore
                            ? `<small>上文：${escapeHtml(hunk.contextBefore)}</small>`
                            : ""
                        }
                        ${hunk.removedLines
                          .map((line) => `<code class="diff-remove">- ${escapeHtml(line || "空行")}</code>`)
                          .join("")}
                        ${hunk.addedLines
                          .map((line) => `<code class="diff-add">+ ${escapeHtml(line || "空行")}</code>`)
                          .join("")}
                      </li>
                    `,
                  )
                  .join("")
              : "<li><span>当前没有行级差异</span><small>正式写回内容与目标记录一致。</small></li>"
          }
        </ul>
      </div>
      <ul class="detail-list">
        ${renderListItems(nextChecks, "当前没有后续检查项。")}
      </ul>
    </div>
  `;
}

function renderManualFormalWritePostExecutionAcceptance(acceptance) {
  if (!acceptance) {
    return "";
  }

  const checks = Array.isArray(acceptance.acceptanceChecks)
    ? acceptance.acceptanceChecks
    : [];
  const target = acceptance.target || {};
  const nextAction = acceptance.nextAction || {};

  return `
    <div class="manual-formal-write-acceptance-panel" aria-label="正式写回后验收包">
      <div class="manual-formal-write-precheck-head">
        <div>
          <span class="section-kicker">Acceptance Packet</span>
          <strong>正式写回后验收包</strong>
        </div>
        <span>${escapeHtml(acceptance.ok ? "验收通过" : "等待写回")}</span>
      </div>
      <p>${escapeHtml(acceptance.summary || "待生成正式写回后验收包。")}</p>
      <small>${escapeHtml(acceptance.safetyBoundary || "仅展示项目内验收包结果。")}</small>
      <div class="manual-formal-write-precheck-grid">
        <div>
          <span>验收进度</span>
          <strong>${escapeHtml(`${acceptance.passedCount ?? 0} / ${acceptance.totalCount ?? 0}`)}</strong>
        </div>
        <div>
          <span>状态码</span>
          <strong>${escapeHtml(acceptance.status || "待生成")}</strong>
        </div>
        <div>
          <span>目标批次</span>
          <strong>${escapeHtml(target.batchLabel || "暂无")}</strong>
        </div>
        <div>
          <span>目标记录</span>
          <strong>${escapeHtml(target.targetRecordPath || "暂无")}</strong>
        </div>
      </div>
      <ul class="manual-formal-write-acceptance-list">
        ${
          checks.length
            ? checks
                .map(
                  (item) => `
                    <li>
                      <span>${escapeHtml(item.label || "验收项")}</span>
                      <strong>${escapeHtml(item.status === "passed" ? "已通过" : "等待")}</strong>
                      <small>${escapeHtml(item.summary || "等待正式写回后检查。")}</small>
                      <code>${escapeHtml(item.expectedEvidence || "等待正式写回后生成")}</code>
                    </li>
                  `,
                )
                .join("")
            : "<li><span>当前没有验收项</span><strong>等待</strong><small>等待正式写回后生成验收项。</small></li>"
        }
      </ul>
      <div class="manual-formal-write-next-action" aria-label="正式写回后验收推荐动作">
        <div>
          <span>推荐动作</span>
          <strong>${escapeHtml(nextAction.label || "待确认")}</strong>
          <small>${escapeHtml(nextAction.summary || "等待正式写回后继续处理。")}</small>
        </div>
        ${
          nextAction.requiredPhrase
            ? `<code>${escapeHtml(nextAction.requiredPhrase)}</code>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderFormalWriteFollowUpPlan(plan) {
  if (!plan) {
    return "";
  }

  const ruleRevision = plan.sections?.ruleRevision || {};
  const keyCaseRerun = plan.sections?.keyCaseRerun || {};
  const commands = Array.isArray(plan.commandChain) ? plan.commandChain : [];
  const ruleReport = ruleRevision.existingReport || null;
  const rerunPlan = keyCaseRerun.plan || null;
  const latestRun = keyCaseRerun.latestRun || null;

  return `
    <div class="formal-write-follow-up-plan-panel" aria-label="正式写回后承接计划">
      <div class="manual-formal-write-precheck-head">
        <div>
          <span class="section-kicker">Follow-up Plan</span>
          <strong>正式写回后承接计划</strong>
        </div>
        <span>${escapeHtml(plan.ok ? "已就绪" : "待补证据")}</span>
      </div>
      <p>${escapeHtml(plan.summary || "待生成正式写回后承接计划。")}</p>
      <small>${escapeHtml(plan.safetyBoundary || "仅展示项目内承接计划。")}</small>
      <div class="formal-write-follow-up-plan-grid">
        <article>
          <span>规则修订任务单</span>
          <strong>${escapeHtml(ruleRevision.label || "待生成")}</strong>
          <p>${escapeHtml(ruleRevision.summary || "等待规则修订任务。")}</p>
          <dl>
            <div><dt>已有任务数</dt><dd>${escapeHtml(ruleReport?.taskCount ?? 0)}</dd></div>
            <div><dt>来源样本数</dt><dd>${escapeHtml(ruleReport?.sourceSampleCount ?? 0)}</dd></div>
            <div><dt>下一步</dt><dd>${escapeHtml(ruleRevision.nextStep?.label || "待确认")}</dd></div>
          </dl>
          ${
            ruleReport?.topTask
              ? `<small>${escapeHtml(ruleReport.topTask.taskTitle || "暂无优先任务")}</small>`
              : ""
          }
        </article>
        <article>
          <span>关键样例复跑计划</span>
          <strong>${escapeHtml(keyCaseRerun.label || "待生成")}</strong>
          <p>${escapeHtml(keyCaseRerun.summary || "等待关键样例复跑任务。")}</p>
          <dl>
            <div><dt>计划 ID</dt><dd>${escapeHtml(rerunPlan?.planId || latestRun?.planId || "暂无")}</dd></div>
            <div><dt>候选案例</dt><dd>${escapeHtml((rerunPlan?.caseIds || []).length)}</dd></div>
            <div><dt>已复跑</dt><dd>${escapeHtml(latestRun?.completedCaseCount ?? 0)}</dd></div>
          </dl>
          <small>${escapeHtml(keyCaseRerun.nextStep?.summary || "等待复跑计划确认。")}</small>
        </article>
      </div>
      <div class="formal-write-follow-up-command-chain" aria-label="承接计划推荐命令链">
        <strong>推荐命令链</strong>
        <ol>
          ${
            commands.length
              ? commands.map((command) => `<li><code>${escapeHtml(command)}</code></li>`).join("")
              : "<li><code>暂无推荐命令</code></li>"
          }
        </ol>
      </div>
    </div>
  `;
}

function renderPiEngineExecutionPositionAudit(audit) {
  if (!audit) {
    return "";
  }

  const artifacts = Array.isArray(audit.artifacts) ? audit.artifacts : [];
  const blockedRepeats = Array.isArray(audit.blockedRepeats) ? audit.blockedRepeats : [];
  const nextAction = audit.nextAction || {};
  const gate = audit.formalWriteGate || {};
  const goalCompletion = audit.goalCompletion || {};
  const completionItems = Array.isArray(goalCompletion.items) ? goalCompletion.items : [];

  return `
    <div class="pi-engine-audit-panel" aria-label="PI Engine 执行位点审计">
      <div class="manual-formal-write-precheck-head">
        <div>
          <span class="section-kicker">PI Engine Position</span>
          <strong>执行位点审计</strong>
        </div>
        <span>${escapeHtml(audit.status === "formal-write-waiting-for-confirmation" ? "等待确认" : "待复查")}</span>
      </div>
      <p>${escapeHtml(audit.summary || "待生成执行位点审计。")}</p>
      <small>${escapeHtml(audit.safetyBoundary || "仅展示项目内审计结果。")}</small>
      <div class="manual-formal-write-precheck-grid">
        <div>
          <span>执行模式</span>
          <strong>${escapeHtml(audit.mode?.piEngineMode || "maintenance")}</strong>
        </div>
        <div>
          <span>资料进度</span>
          <strong>${escapeHtml(`${audit.artifactProgress?.presentCount ?? 0} / ${audit.artifactProgress?.totalCount ?? 0}`)}</strong>
        </div>
        <div>
          <span>写回门禁</span>
          <strong>${escapeHtml(gate.readinessStatus || "待检查")}</strong>
        </div>
        <div>
          <span>验收进度</span>
          <strong>${escapeHtml(gate.postExecutionAcceptanceProgress || "0 / 0")}</strong>
        </div>
        <div>
          <span>目标完成度</span>
          <strong>${escapeHtml(`${goalCompletion.completedCount ?? 0} / ${goalCompletion.totalCount ?? 0}`)}</strong>
        </div>
        <div>
          <span>目标状态</span>
          <strong>${escapeHtml(goalCompletion.status || "待检查")}</strong>
        </div>
      </div>
      <div class="pi-engine-audit-columns">
        <div>
          <strong>已确认资料</strong>
          <ul>
            ${
              artifacts.length
                ? artifacts
                    .map(
                      (item) => `
                        <li>
                          <span>${escapeHtml(item.label || "资料")}</span>
                          <small>${escapeHtml(item.status === "present" ? "已归档" : "待补齐")}</small>
                        </li>
                      `,
                    )
                    .join("")
                : "<li><span>暂无资料</span><small>刷新后重新读取。</small></li>"
            }
          </ul>
        </div>
        <div>
          <strong>不重复执行</strong>
          <ul>
            ${renderListItems(blockedRepeats, "当前没有重复执行约束。")}
          </ul>
        </div>
      </div>
      <div class="pi-engine-completion-list" aria-label="目标完成度审计">
        <strong>目标完成度审计</strong>
        <ul>
          ${
            completionItems.length
              ? completionItems
                  .map(
                    (item) => `
                      <li>
                        <span>${escapeHtml(item.label || "完成项")}</span>
                        <strong>${escapeHtml(item.status || "待检查")}</strong>
                        <small>${escapeHtml(item.evidence || "待补充证据")}</small>
                      </li>
                    `,
                  )
                  .join("")
              : "<li><span>暂无完成度项</span><strong>待检查</strong><small>刷新后重新读取。</small></li>"
          }
        </ul>
      </div>
      <div class="manual-formal-write-next-action" aria-label="PI Engine 执行位点推荐动作">
        <div>
          <span>唯一下一步</span>
          <strong>${escapeHtml(nextAction.label || "刷新写回门禁")}</strong>
          <small>${escapeHtml(nextAction.summary || "读取最新项目证据后继续。")}</small>
        </div>
        ${
          nextAction.requiredPhrase
            ? `<code>${escapeHtml(nextAction.requiredPhrase)}</code>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderManualConfirmationHandoffPacket(packet) {
  if (!packet) {
    return "";
  }

  const nextChecks = Array.isArray(packet.nextChecks) ? packet.nextChecks : [];
  const confirmationBlock = String(packet.confirmationBlock || "").trim();

  return `
    <div class="manual-confirmation-handoff-panel" aria-label="人工确认交接包">
      <div class="manual-confirmation-handoff-head">
        <div>
          <span class="section-kicker">Handoff Packet</span>
          <strong>人工确认交接包</strong>
        </div>
        <span>${escapeHtml(packet.ok ? "可交接" : "需修正")}</span>
      </div>
      <p>${escapeHtml(packet.summary || "待生成交接包。")}</p>
      <small>页面自动读取项目内交接包；人工处理只需确认是否采用推荐确认块。</small>
      <small>${escapeHtml(packet.safetyBoundary || "仅展示项目内交接结果。")}</small>
      <div class="manual-confirmation-decision-box">
        <span>当前决策项</span>
        <strong>${escapeHtml(packet.ok ? "采用推荐确认块 / 暂不采用" : "先修正交接包")}</strong>
        <small>${escapeHtml(packet.ok ? "确认采用后，再进入安全预览写入与门禁复查。" : "交接包就绪前保持正式写回锁定。")}</small>
      </div>
      <div class="manual-confirmation-handoff-grid">
        <div>
          <span>目标批次</span>
          <strong>${escapeHtml(packet.targetBatchLabel || "暂无")}</strong>
        </div>
        <div>
          <span>目标记录</span>
          <strong>${escapeHtml(packet.targetPath || "暂无")}</strong>
        </div>
        <div>
          <span>推荐版本</span>
          <strong>${escapeHtml(packet.suggestedGateResult?.canProceedToFormalWrite ? "写入后打开门禁" : "写入后保持锁定")}</strong>
        </div>
        <div>
          <span>保守版本</span>
          <strong>${escapeHtml(packet.conservativeGateResult?.canProceedToFormalWrite ? "写入后打开门禁" : "写入后保持锁定")}</strong>
        </div>
      </div>
      <div class="manual-confirmation-handoff-copy">
        <div class="manual-confirmation-handoff-copy-head">
          <span>推荐确认块</span>
          <button type="button" class="ghost-button" data-copy-handoff-confirmation>复制确认块</button>
        </div>
        <pre data-handoff-confirmation-block>${escapeHtml(confirmationBlock || "待生成")}</pre>
      </div>
      <div class="manual-confirmation-handoff-next">
        <span>后续复查</span>
        <ol>
          ${nextChecks.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>暂无</li>"}
        </ol>
      </div>
      ${
        packet.outputPaths?.markdown
          ? `<small>交接包文件：${escapeHtml(packet.outputPaths.markdown)}</small>`
          : ""
      }
    </div>
  `;
}

function renderManualConfirmationDecision(decision) {
  if (!decision) {
    return "";
  }

  return `
    <div class="manual-confirmation-decision-panel" aria-label="人工确认决策记录">
      <div class="manual-confirmation-decision-head">
        <div>
          <span class="section-kicker">Decision Record</span>
          <strong>人工确认决策记录</strong>
        </div>
        <span>${escapeHtml(decision.decisionLabel || "待确认")}</span>
      </div>
      <p>${escapeHtml(decision.summary || "决策记录待生成。")}</p>
      <small>${escapeHtml(decision.safetyBoundary || "仅展示项目内决策记录。")}</small>
      <div class="manual-confirmation-decision-grid">
        <div>
          <span>校验状态</span>
          <strong>${escapeHtml(decision.ok ? "通过" : "需修正")}</strong>
        </div>
        <div>
          <span>决策状态</span>
          <strong>${escapeHtml(decision.decisionStatus || "pending")}</strong>
        </div>
        <div>
          <span>目标批次</span>
          <strong>${escapeHtml(decision.targetBatchLabel || "暂无")}</strong>
        </div>
        <div>
          <span>下一步</span>
          <strong>${escapeHtml(decision.canProceedToSafePreviewWrite ? "进入写入前复查" : "保持等待")}</strong>
        </div>
      </div>
      <div class="manual-confirmation-decision-meta">
        <span>记录文件</span>
        <strong>${escapeHtml(decision.outputPaths?.decision || decision.sourcePath || "暂无")}</strong>
      </div>
    </div>
  `;
}

function renderManualConfirmationDecisionAdoptionPreview(preview) {
  if (!preview) {
    return "";
  }

  return `
    <div class="manual-confirmation-adoption-preview-panel" aria-label="采用推荐确认块预演">
      <div class="manual-confirmation-adoption-preview-head">
        <div>
          <span class="section-kicker">Adoption Preview</span>
          <strong>采用推荐确认块预演</strong>
        </div>
        <span>${escapeHtml(preview.ok ? "预演通过" : "需修正")}</span>
      </div>
      <p>${escapeHtml(preview.summary || "采用预演待生成。")}</p>
      <small>${escapeHtml(preview.safetyBoundary || "仅展示项目内采用预演。")}</small>
      <div class="manual-confirmation-adoption-preview-grid">
        <div>
          <span>当前决策</span>
          <strong>${escapeHtml(preview.currentDecision?.decisionLabel || "暂无")}</strong>
        </div>
        <div>
          <span>预演决策</span>
          <strong>${escapeHtml(preview.adoptedDecision?.decisionLabel || "暂无")}</strong>
        </div>
        <div>
          <span>预演结果</span>
          <strong>${escapeHtml(preview.canProceedToSafePreviewWriteAfterAdoption ? "进入写入前复查" : "保持等待")}</strong>
        </div>
        <div>
          <span>状态码</span>
          <strong>${escapeHtml(preview.status || "待生成")}</strong>
        </div>
      </div>
      ${
        preview.outputPaths?.markdown
          ? `<small>预演报告：${escapeHtml(preview.outputPaths.markdown)}</small>`
          : ""
      }
    </div>
  `;
}

function renderManualConfirmationDecisionAdoptionPacket(packet) {
  if (!packet) {
    return "";
  }

  const replacements = Array.isArray(packet.replacements) ? packet.replacements : [];
  const adoptionReplacementText = replacements
    .map((item) => [item.from || "", item.to || ""].filter(Boolean).join("\n"))
    .filter(Boolean)
    .join("\n\n");
  const rejectionReplacements = [
    {
      label: "决策状态",
      from: "- 决策状态：pending",
      to: "- 决策状态：reject-recommended",
    },
    {
      label: "决策说明",
      from: "- 决策说明：待确认",
      to: "- 决策说明：暂不采用推荐确认块",
    },
  ];
  const rejectionReplacementText = rejectionReplacements
    .map((item) => [item.from || "", item.to || ""].filter(Boolean).join("\n"))
    .join("\n\n");
  const replacementText = [
    "采用推荐确认块",
    adoptionReplacementText || "暂无",
    "",
    "暂不采用推荐确认块",
    rejectionReplacementText,
  ].join("\n");

  return `
    <div class="manual-confirmation-adoption-packet-panel" aria-label="人工采用操作包">
      <div class="manual-confirmation-adoption-packet-head">
        <div>
          <span class="section-kicker">Adoption Packet</span>
          <strong>人工采用操作包</strong>
        </div>
        <span>${escapeHtml(packet.ok ? "可使用" : "需修正")}</span>
      </div>
      <p>${escapeHtml(packet.summary || "操作包待生成。")}</p>
      <small>${escapeHtml(packet.safetyBoundary || "仅展示项目内人工操作包。")}</small>
      <div class="manual-confirmation-adoption-packet-grid">
        <div>
          <span>当前决策</span>
          <strong>${escapeHtml(packet.currentDecision?.decisionLabel || "暂无")}</strong>
        </div>
        <div>
          <span>操作后决策</span>
          <strong>${escapeHtml(packet.adoptedDecision?.decisionLabel || "暂无")}</strong>
        </div>
        <div>
          <span>操作后结果</span>
          <strong>${escapeHtml(packet.canProceedToSafePreviewWriteAfterAdoption ? "进入写入前复查" : "保持等待")}</strong>
        </div>
        <div>
          <span>记录文件</span>
          <strong>${escapeHtml(packet.sourcePaths?.decision || "暂无")}</strong>
        </div>
      </div>
      <div class="manual-confirmation-adoption-replacements">
        <div class="manual-confirmation-adoption-replacements-head">
          <span>采用替换项</span>
          <button type="button" class="ghost-button" data-copy-adoption-replacements>复制替换项</button>
        </div>
        ${replacements
          .map(
            (item) => `
              <div>
                <strong>${escapeHtml(item.label || "替换")}</strong>
                <code>${escapeHtml(item.from || "")}</code>
                <code>${escapeHtml(item.to || "")}</code>
              </div>
            `,
          )
          .join("") || "<small>暂无</small>"}
        <pre data-adoption-replacement-text>${escapeHtml(replacementText || "")}</pre>
      </div>
      <div class="manual-confirmation-rejection-replacements" aria-label="暂不采用替换项">
        <span>暂不采用替换项</span>
        ${rejectionReplacements
          .map(
            (item) => `
              <div>
                <strong>${escapeHtml(item.label || "替换")}</strong>
                <code>${escapeHtml(item.from || "")}</code>
                <code>${escapeHtml(item.to || "")}</code>
              </div>
            `,
          )
          .join("")}
      </div>
      ${
        packet.outputPaths?.markdown
          ? `<small>操作包文件：${escapeHtml(packet.outputPaths.markdown)}</small>`
          : ""
      }
    </div>
  `;
}

function renderManualConfirmationAdoptionProgress(decision, preview, packet) {
  if (!decision && !preview && !packet) {
    return "";
  }

  const decisionReady = Boolean(decision?.ok);
  const previewReady = Boolean(preview?.ok && preview?.canProceedToSafePreviewWriteAfterAdoption);
  const packetReady = Boolean(packet?.ok);
  const adoptionConfirmed = decision?.decisionStatus === "adopt-recommended";
  const currentStep = adoptionConfirmed
    ? "已采用推荐确认块"
    : packetReady
      ? "等待人工采用决策"
      : previewReady
        ? "等待生成操作包"
        : "等待采用预演";
  const nextAction = adoptionConfirmed
    ? "进入安全预览写入前复查"
    : packetReady
      ? "复制替换项并更新决策记录"
      : previewReady
        ? "生成人工采用操作包"
        : "先完成采用推荐确认块预演";
  const progressItems = [
    {
      label: "决策记录",
      status: decisionReady ? "已读取" : "待读取",
      active: decisionReady,
    },
    {
      label: "采用预演",
      status: previewReady ? "已通过" : "待预演",
      active: previewReady,
    },
    {
      label: "操作包",
      status: packetReady ? "可使用" : "待生成",
      active: packetReady,
    },
  ];
  const guidanceItems = adoptionConfirmed
    ? [
        "决策记录已采用推荐确认块。",
        "重新检查写回门禁状态。",
        "进入安全预览写入前复查。",
      ]
    : packetReady
      ? [
          "查看采用预演是否通过。",
          "复制操作包中的两条替换项。",
          "人工更新项目内决策记录后重新刷新门禁。",
        ]
      : previewReady
        ? [
            "采用预演已通过。",
            "生成并核对人工采用操作包。",
            "待操作包就绪后再处理决策记录。",
          ]
        : [
            "先生成采用推荐确认块预演。",
            "确认预演不会触发写回动作。",
            "预演通过后再生成采用操作包。",
          ];
  const outcomeItems = [
    {
      label: "采用推荐确认块",
      status: previewReady ? "可进入复查" : "等待预演",
      description: previewReady
        ? "人工更新决策记录后，状态会进入安全预览写入前复查。"
        : "需要先完成采用预演，再判断是否进入复查。",
    },
    {
      label: "暂不采用推荐确认块",
      status: "保持锁定",
      description: "决策记录可保持正式写回锁定，后续继续补充人工结论。",
    },
  ];
  const preflightItems = [
    {
      label: "交接证据",
      status: packetReady ? "已就绪" : "待生成",
      passed: packetReady,
    },
    {
      label: "采用预演",
      status: previewReady ? "已通过" : "待通过",
      passed: previewReady,
    },
    {
      label: "人工决策",
      status: adoptionConfirmed ? "已采用" : "待确认",
      passed: adoptionConfirmed,
    },
  ];
  const canEnterPrecheck = Boolean(adoptionConfirmed && previewReady && packetReady);
  const preflightSummary = canEnterPrecheck
    ? "前置检查已满足，可以进入安全预览写入前复查。"
    : "前置检查尚未满足，正式写回继续保持锁定。";

  return `
    <div class="manual-confirmation-adoption-progress-panel" aria-label="人工采用进度总览">
      <div class="manual-confirmation-adoption-progress-head">
        <div>
          <span class="section-kicker">Adoption Progress</span>
          <strong>人工采用进度总览</strong>
        </div>
        <span>${escapeHtml(currentStep)}</span>
      </div>
      <p>${escapeHtml(`当前状态：${currentStep}。下一步：${nextAction}。`)}</p>
      <div class="manual-confirmation-adoption-progress-steps">
        ${progressItems
          .map(
            (item) => `
              <div class="${item.active ? "manual-confirmation-adoption-progress-done" : ""}">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.status)}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="manual-confirmation-adoption-guidance" aria-label="人工采用操作指引">
        <strong>人工采用操作指引</strong>
        <ol>
          ${guidanceItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </div>
      <div class="manual-confirmation-decision-outcomes" aria-label="人工决策后果预览">
        <strong>人工决策后果预览</strong>
        <div>
          ${outcomeItems
            .map(
              (item) => `
                <article>
                  <span>${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.status)}</strong>
                  <p>${escapeHtml(item.description)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="manual-confirmation-preflight-checks" aria-label="安全预览写入前置检查">
        <div>
          <strong>安全预览写入前置检查</strong>
          <span>${escapeHtml(canEnterPrecheck ? "可进入复查" : "继续锁定")}</span>
        </div>
        <p>${escapeHtml(preflightSummary)}</p>
        <ul>
          ${preflightItems
            .map(
              (item) => `
                <li class="${item.passed ? "manual-confirmation-preflight-pass" : ""}">
                  <span>${escapeHtml(item.label)}</span>
                  <strong>${escapeHtml(item.status)}</strong>
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

export function renderWritebackGateOverviewStatus(
  container,
  readiness = null,
  followUpProgress = {},
  manualConfirmationDraftValidation = null,
  manualConfirmationApplyPreview = null,
  manualConfirmationHandoffPacket = null,
  manualConfirmationDecision = null,
  manualConfirmationDecisionAdoptionPreview = null,
  manualConfirmationDecisionAdoptionPacket = null,
  manualConfirmationSafePreviewAdoptionPacket = null,
  manualConfirmationSafePreviewWritePrecheck = null,
  manualConfirmationSafePreviewWriteProjection = null,
  manualConfirmationSafePreviewWriteApply = null,
  manualFormalWriteExecutionPrecheck = null,
  manualFormalWriteExecutionPacket = null,
  manualFormalWritePostExecutionAcceptance = null,
  piEngineExecutionPositionAudit = null,
  formalWriteFollowUpPlan = null,
) {
  if (!readiness) {
    container.innerHTML = `
      <p class="empty-state">刷新后将展示最新安全预览、人工确认和正式写回许可。</p>
      ${renderPiEngineExecutionPositionAudit(piEngineExecutionPositionAudit)}
      ${renderManualConfirmationDraftValidation(manualConfirmationDraftValidation)}
      ${renderManualConfirmationApplyPreview(manualConfirmationApplyPreview)}
      ${renderManualConfirmationHandoffPacket(manualConfirmationHandoffPacket)}
      ${renderManualConfirmationAdoptionProgress(manualConfirmationDecision, manualConfirmationDecisionAdoptionPreview, manualConfirmationDecisionAdoptionPacket)}
      ${renderManualConfirmationDecision(manualConfirmationDecision)}
      ${renderManualConfirmationDecisionAdoptionPreview(manualConfirmationDecisionAdoptionPreview)}
      ${renderManualConfirmationDecisionAdoptionPacket(manualConfirmationDecisionAdoptionPacket)}
      ${renderManualConfirmationSafePreviewAdoptionPacket(manualConfirmationSafePreviewAdoptionPacket)}
      ${renderManualConfirmationSafePreviewWritePrecheck(manualConfirmationSafePreviewWritePrecheck, manualConfirmationSafePreviewWriteApply)}
      ${renderManualConfirmationSafePreviewWriteProjection(manualConfirmationSafePreviewWriteProjection)}
      ${renderManualFormalWriteExecutionPrecheck(manualFormalWriteExecutionPrecheck)}
      ${renderManualFormalWriteExecutionPacket(manualFormalWriteExecutionPacket)}
      ${renderManualFormalWritePostExecutionAcceptance(manualFormalWritePostExecutionAcceptance)}
      ${renderFormalWriteFollowUpPlan(formalWriteFollowUpPlan)}
      ${hasWritebackActionProgress(followUpProgress) ? renderWritebackActionProgress(followUpProgress) : ""}
    `;
    return;
  }

  const safeWriteStatus = readiness.latestSafeWriteStatus || null;
  const effectiveReadiness = manualConfirmationDecision && !readiness.manualConfirmationDecision
    ? { ...readiness, manualConfirmationDecision }
    : readiness;
  const manualDecisionAdopted = Boolean(
    effectiveReadiness.manualConfirmationDecision?.decisionStatus === "adopt-recommended" &&
      effectiveReadiness.manualConfirmationDecision?.canProceedToSafePreviewWrite,
  );
  const canProceed = Boolean(safeWriteStatus?.canProceedToFormalWrite && manualDecisionAdopted);
  const hasManualConfirmation = Boolean(safeWriteStatus?.hasManualConfirmation);
  const readbackLabel = safeWriteStatus
    ? safeWriteStatus.readbackOk && safeWriteStatus.matchedExpectedContent
      ? "已确认"
      : "待复查"
    : "暂无";
  const permissionLabel = canProceed ? "可正式写回" : "待人工确认";
  const progressItems = buildWritebackGateProgress(effectiveReadiness, safeWriteStatus, canProceed);

  container.innerHTML = `
    <div class="writeback-status-board" data-writeback-gate-status-panel>
      ${renderPiEngineExecutionPositionAudit(piEngineExecutionPositionAudit)}
      <div class="writeback-status-head">
        <div>
          <span class="section-kicker">Current Gate</span>
          <strong>${escapeHtml(readiness.statusLabel || readiness.status || "待检查")}</strong>
        </div>
        <span>${escapeHtml(permissionLabel)}</span>
      </div>
      <div class="writeback-status-grid">
        <div><span>状态码</span><strong>${escapeHtml(readiness.status || "待检查")}</strong></div>
        <div><span>目标批次</span><strong>${escapeHtml(safeWriteStatus?.targetBatchLabel || "暂无")}</strong></div>
        <div><span>安全预览读回</span><strong>${escapeHtml(readbackLabel)}</strong></div>
        <div><span>人工确认</span><strong>${escapeHtml(hasManualConfirmation ? "已填写" : "待补齐")}</strong></div>
        <div><span>人工结论</span><strong>${escapeHtml(safeWriteStatus?.manualReviewConclusion || "待补")}</strong></div>
        <div><span>写回许可</span><strong>${escapeHtml(permissionLabel)}</strong></div>
      </div>
      ${renderWritebackGateProgress(progressItems)}
      ${renderWritebackManualConfirmationGuidance(safeWriteStatus, hasManualConfirmation)}
      ${renderManualConfirmationDraftValidation(manualConfirmationDraftValidation)}
      ${renderManualConfirmationApplyPreview(manualConfirmationApplyPreview)}
      ${renderManualConfirmationHandoffPacket(manualConfirmationHandoffPacket)}
      ${renderManualConfirmationAdoptionProgress(manualConfirmationDecision, manualConfirmationDecisionAdoptionPreview, manualConfirmationDecisionAdoptionPacket)}
      ${renderManualConfirmationDecision(manualConfirmationDecision)}
      ${renderManualConfirmationDecisionAdoptionPreview(manualConfirmationDecisionAdoptionPreview)}
      ${renderManualConfirmationDecisionAdoptionPacket(manualConfirmationDecisionAdoptionPacket)}
      ${renderManualConfirmationSafePreviewAdoptionPacket(manualConfirmationSafePreviewAdoptionPacket)}
      ${renderManualConfirmationSafePreviewWritePrecheck(manualConfirmationSafePreviewWritePrecheck, manualConfirmationSafePreviewWriteApply)}
      ${renderManualConfirmationSafePreviewWriteProjection(manualConfirmationSafePreviewWriteProjection)}
      ${renderManualFormalWriteExecutionPrecheck(manualFormalWriteExecutionPrecheck)}
      ${renderManualFormalWriteExecutionPacket(manualFormalWriteExecutionPacket)}
      ${renderManualFormalWritePostExecutionAcceptance(manualFormalWritePostExecutionAcceptance)}
      ${renderFormalWriteFollowUpPlan(formalWriteFollowUpPlan)}
      ${renderWritebackActionProgress(followUpProgress)}
      <p class="micro-copy">${escapeHtml(readiness.summary || "待补")}</p>
      ${renderFormalWriteControlledAction(canProceed)}
    </div>
  `;
}

function formatFormalWriteTaskNextStep(taskType) {
  const labels = {
    "rule-revision": "下一步：整理规则修订任务单，进入人工确认。",
    "key-case-rerun": "下一步：选择关键样例，安排规则调整后的复跑验证。",
  };

  return labels[taskType] || "下一步：确认任务边界后再继续处理。";
}

function renderPhaseStatus(status) {
  const label =
    status === "completed"
      ? "已完成"
      : status === "active"
        ? "当前阶段"
        : status === "pending"
          ? "待进行"
          : "";

  if (!label) {
    return "";
  }

  return `<span class="tag">${escapeHtml(label)}</span>`;
}

function buildCardTopSummary(card) {
  return [
    {
      label: "建议先做什么",
      value: card.primaryAssetActionLabel || "待补充",
    },
    {
      label: "点击逻辑",
      value: card.clickReason || "待补充",
    },
    {
      label: "风险提醒",
      value: card.riskNote || "待补充",
    },
    {
      label: "更适合的内容",
      value: (card.bestFor || []).slice(0, 2).join(" / ") || "待补充",
    },
  ];
}

function renderFlowProgress(currentStep) {
  const steps = [
    {
      id: "choose",
      label: "1. 选方向",
      description: "先确定最值得继续改的那张卡。",
    },
    {
      id: "refine",
      label: "2. 提二轮反馈",
      description: "保留一点，只改一个主变量。",
    },
    {
      id: "compare",
      label: "3. 看改前改后",
      description: "确认这轮到底改了哪里。",
    },
  ];

  const currentIndex = Math.max(
    0,
    steps.findIndex((item) => item.id === currentStep),
  );

  return `
    <div class="flow-progress" aria-label="当前流程进度">
      ${steps
        .map((step, index) => {
          const status =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "active"
                : "pending";

          const statusLabel =
            status === "done" ? "已完成" : status === "active" ? "当前步骤" : "待进行";

          return `
            <article class="flow-step flow-step-${status}">
              <span class="flow-step-status">${statusLabel}</span>
              <strong>${escapeHtml(step.label)}</strong>
              <p>${escapeHtml(step.description)}</p>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderJourneyBridge(stageLabel, carryText, nextAction) {
  return `
    <div class="journey-bridge">
      <div class="journey-bridge-top">
        <span class="journey-chip">${escapeHtml(stageLabel)}</span>
        <strong>${escapeHtml(nextAction)}</strong>
      </div>
      <p>${escapeHtml(carryText)}</p>
    </div>
  `;
}

function formatProgressTimestamp(value) {
  if (!value) {
    return "时间待补";
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(new Date(timestamp));
}

function resolveNextFollowUpItem(checklist, progress) {
  return buildFollowUpProgressSummary(checklist, progress).nextEntry;
}

function renderSignalGroups(groups) {
  if (!groups || groups.length === 0) {
    return `<div class="empty-state">暂无方向判断清单</div>`;
  }

  return groups
    .map(
      (group) => `
        <div class="sub-block">
          <strong>${escapeHtml(group.groupLabel)}</strong>
          <ul class="detail-list">${renderListItems(group.signals, "暂无")}</ul>
        </div>
      `,
    )
    .join("");
}

function renderRealCaseBatchValidationSummary(summary) {
  if (!summary) {
    return `<p class="empty-state">暂无批量校验摘要。</p>`;
  }

  const topMissingFieldStats = (summary.missingFieldStats || []).slice(0, 5);
  const recommendedBatchActions = summary.recommendedBatchActions || [];

  return `
    <div class="sub-block">
      <strong>批量字段校验摘要</strong>
      <div class="data-list compact-list">
        <div><span>案例数</span><strong>${escapeHtml(summary.summary.totalRealCases)}</strong></div>
        <div><span>可进入手动验证</span><strong>${escapeHtml(summary.summary.readyCount)}</strong></div>
        <div><span>部分回填</span><strong>${escapeHtml(summary.summary.partialCount)}</strong></div>
        <div><span>待回填</span><strong>${escapeHtml(summary.summary.pendingCount)}</strong></div>
        <div><span>缺失字段总数</span><strong>${escapeHtml(summary.summary.totalMissingFields)}</strong></div>
        <div><span>平均每条缺失</span><strong>${escapeHtml(summary.summary.avgMissingFields)}</strong></div>
      </div>
    </div>
    <div class="split-block">
      <div class="sub-block">
        <strong>建议先补的批量动作</strong>
        <ul class="detail-list">
          ${
            recommendedBatchActions.length
              ? recommendedBatchActions
                  .map(
                    (item) => `
                      <li>
                        ${escapeHtml(item.label)} · ${escapeHtml(item.priority)}
                        · 影响 ${escapeHtml(item.affectedCaseCount)} 条
                        · 先补 ${escapeHtml(item.codeField || "待补字段")}
                      </li>
                    `,
                  )
                  .join("")
              : "<li>暂无批量推荐动作</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>为什么先做这些</strong>
        <ul class="detail-list">
          ${
            recommendedBatchActions.length
              ? recommendedBatchActions
                  .slice(0, 3)
                  .map(
                    (item) => `
                      <li>
                        ${escapeHtml(item.label)}：${escapeHtml(item.priorityReason || item.prompt || "待补说明")}
                      </li>
                    `,
                  )
                  .join("")
              : "<li>暂无说明</li>"
          }
        </ul>
      </div>
    </div>
    <div class="split-block">
      <div class="sub-block">
        <strong>本批次最常缺的字段</strong>
        <ul class="detail-list">
          ${
            topMissingFieldStats.length
              ? topMissingFieldStats
                  .map(
                    (item) =>
                      `<li>${escapeHtml(item.label)} · ${escapeHtml(item.count)} 条案例缺失</li>`,
                  )
                  .join("")
              : "<li>暂无缺失字段</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>逐条案例风险</strong>
        <ul class="detail-list">
          ${(summary.rows || [])
            .map(
              (row) => `
                <li>
                  ${escapeHtml(row.caseId)} · ${escapeHtml(row.status)}
                  · 缺 ${escapeHtml(row.missingCount)} 项
                  · ${escapeHtml((row.topMissingFields || []).join(" / ") || "暂无")}
                  · 下一步：${escapeHtml(row.nextTask?.label || "待补")}
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
    </div>
  `;
}

export function reveal(element) {
  element.classList.remove("hidden");
}

export function hide(element) {
  element.classList.add("hidden");
}

export function serializeForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

export function patchFormValues(form, data) {
  form.contentTopic.value = data.contentTopic || "";
  form.contentGoal.value = data.contentGoal || "";
  form.userAssetType.value = data.userAssetType || "截图";
  form.platform.value = data.platform || "抖音";
  form.referencePreference.value =
    data.referencePreference || data.desiredCoverFeel || data.userReferencePreference || "";
  form.assetDescription.value = data.assetDescription || "";
  form.assetNotes.value = data.assetNotes || "";
}

export function renderAssetPreview(panel, content, clearButton, preview) {
  if (!preview) {
    panel.innerHTML = `
      <div class="asset-empty-state">
        <p class="micro-copy">当前还没有本地参考图。</p>
        <p>上传一张截图、参考封面或内容相关图片后，上传区域会先显示本地预览。当前阶段只做浏览器本地预览，不上传服务器。</p>
      </div>
    `;
    hide(clearButton);
    return;
  }

  content.innerHTML = `
    <div class="asset-preview-card">
      <div class="asset-preview-media">
        <img src="${escapeHtml(preview.objectUrl)}" alt="${escapeHtml(preview.fileName)}" />
      </div>
      <div class="asset-preview-meta">
        <p class="micro-copy">本地素材预览</p>
        <h3>${escapeHtml(preview.fileName)}</h3>
        <div class="tag-row">
          <span class="tag">${escapeHtml(preview.sizeLabel)}</span>
          <span class="tag">${escapeHtml(preview.dimensionsLabel)}</span>
          <span class="tag">${escapeHtml(preview.mimeType)}</span>
        </div>
        <p>这张图现在只作为首轮输入时的素材上下文参考。后续接入图片理解、找图推荐或生图时，会沿用这块结构继续扩。</p>
      </div>
    </div>
  `;
  reveal(clearButton);
}

export function renderAnalysisOverview(analysisSummary, analysisMeta, analysis) {
  const fields = analysis.fields;
  const ruleMeta = analysis.ruleMeta || {};
  const topDirection = analysis.rankedDirections?.[0];
  const topCard = analysis.cards?.[0];
  analysisSummary.innerHTML = `
    <div class="summary-grid">
      <div class="summary-item">
        <span class="summary-label">主点击机制</span>
        <strong>${escapeHtml(fields.clickDriverPrimary)}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">内容类型</span>
        <strong>${escapeHtml(fields.contentTypePrimary)}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">输入模式</span>
        <strong>${escapeHtml(fields.minimumInputMode)}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">平台</span>
        <strong>${escapeHtml(fields.platform)}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">素材类型建议</span>
        <strong>${escapeHtml(fields.suggestedAssetType)}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">首轮行动路径</span>
        <strong>${escapeHtml(fields.primaryAssetActionLabel)}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">命中主方向</span>
        <strong>${escapeHtml(topCard?.directionLabelUserFacing || "待补充")}</strong>
      </div>
      <div class="summary-item">
        <span class="summary-label">规则版本</span>
        <strong>${escapeHtml(ruleMeta.version || "unknown")}</strong>
      </div>
    </div>
  `;

  analysisMeta.innerHTML = `
    <div class="meta-card">
      <p class="meta-lead">系统不是直接生成单张图，而是先判断“哪种封面点击逻辑最值得优先尝试”。</p>
      <p class="meta-support"><strong>素材类型建议：</strong>${escapeHtml(fields.suggestedAssetReason)}</p>
      <p class="meta-support"><strong>建议先做什么：</strong>${escapeHtml(fields.primaryAssetActionReason)}</p>
      <div class="tag-row">
        ${renderInlineTags(
          [
            fields.hasClearResult ? "有明确结果" : null,
            fields.hasContrast ? "有反差空间" : null,
            fields.hasCuriosityGap ? "有悬念空间" : null,
            fields.requiresClarity ? "需要讲明白" : null,
            fields.requiresTrust ? "需要可信感" : null,
          ].filter(Boolean),
          "当前判断信号较少",
        )}
      </div>
    </div>
    <div class="meta-card rule-hit-card">
      <p class="meta-lead">当前首轮优先推荐该方向的理由</p>
      <div class="data-list">
        <div><span>命中方向</span><strong>${escapeHtml(topCard?.directionTypeInternal || "待补充")} / ${escapeHtml(topCard?.directionLabelUserFacing || "待补充")}</strong></div>
        <div><span>内容匹配分</span><strong>${escapeHtml(topDirection?.fitScoreContent ?? "待补充")}</strong></div>
        <div><span>素材匹配分</span><strong>${escapeHtml(topDirection?.fitScoreAsset ?? "待补充")}</strong></div>
        <div><span>平台匹配分</span><strong>${escapeHtml(topDirection?.fitScorePlatform ?? "待补充")}</strong></div>
        <div><span>规则来源</span><strong>${escapeHtml(ruleMeta.source || "待补充")} / ${escapeHtml(ruleMeta.effectCount ?? "0")} 类方向</strong></div>
        <div><span>反馈映射规模</span><strong>负向 ${escapeHtml(ruleMeta.negativeMappingCount ?? "0")} 条 / 正向 ${escapeHtml(ruleMeta.positiveMappingCount ?? "0")} 条</strong></div>
        <div><span>方向判断规则</span><strong>${escapeHtml(ruleMeta.directionSignalCount ?? "0")} 类信号清单</strong></div>
      </div>
      <p class="meta-support"><strong>主判断理由：</strong>${escapeHtml(topDirection?.directionFitReason || topCard?.fitReason || "待补充")}</p>
      <div class="sub-block">
        <strong>实际命中信号</strong>
        <div class="tag-row">${renderInlineTags(topDirection?.signalMatches || topCard?.signalMatches || [], "待补命中信号")}</div>
      </div>
      <div class="sub-block">
        <strong>该方向固定判断清单</strong>
        <div class="tag-row">${renderInlineTags(
          (topCard?.directionSignalChecklist?.feedbackTriggers || []).slice(0, 4),
          "待补反馈触发词",
        )}</div>
      </div>
    </div>
  `;
}

export function renderActionWorkspace(container, workspace) {
  if (!workspace) {
    container.innerHTML = "";
    return;
  }

  const nextSteps = (workspace.nextSteps || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const checkpoints = (workspace.checkpoints || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const suggestedInputs = (workspace.suggestedInputs || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  container.innerHTML = `
    <div class="workspace-board">
      <div class="result-highlight">
        <p class="micro-copy">Next Workspace</p>
        <h3>${escapeHtml(workspace.workspaceTitle)}</h3>
        <p>${escapeHtml(workspace.workspaceGoal)}</p>
      </div>
      <div class="data-list">
        <div><span>优先处理理由</span><strong>${escapeHtml(workspace.whyNow)}</strong></div>
        <div><span>当前主方向</span><strong>${escapeHtml(workspace.linkedCardDirection || "待补充")}</strong></div>
      </div>
      <div class="split-block">
        <div class="sub-block">
          <strong>下一步建议</strong>
          <ol class="detail-list">${nextSteps}</ol>
        </div>
        <div class="sub-block">
          <strong>检查点</strong>
          <ul class="detail-list">${checkpoints}</ul>
        </div>
      </div>
      <div class="sub-block">
        <strong>建议补充的输入</strong>
        <ul class="detail-list">${suggestedInputs}</ul>
      </div>
    </div>
  `;
}

export function renderActionWorkspacePathSelector(container, workspaces = [], selectedWorkspaceId = "") {
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    container.innerHTML = "";
    return;
  }

  const selectedId = selectedWorkspaceId || workspaces[0]?.workspaceId || "";
  const options = workspaces
    .map((workspace) => {
      const isSelected = workspace.workspaceId === selectedId;

      return `
        <button
          type="button"
          class="workspace-path-option${isSelected ? " is-active" : ""}"
          data-workspace-id="${escapeHtml(workspace.workspaceId)}"
          aria-pressed="${isSelected ? "true" : "false"}"
        >
          <span>${escapeHtml(workspace.workspaceTitle)}</span>
          <small>${escapeHtml(workspace.workspaceGoal)}</small>
        </button>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="workspace-path-selector" aria-label="工作区路径选择">
      <div class="workspace-path-header">
        <span>工作区路径</span>
        <strong>请选择下一步处理路径</strong>
      </div>
      <div class="workspace-path-options">${options}</div>
    </div>
  `;
}

export function renderActionWorkspaceForm(container, submitButton, workspace) {
  if (!workspace?.inputSchema?.length) {
    container.innerHTML = `<p class="empty-state">当前工作区还没有可填写输入。</p>`;
    submitButton.disabled = true;
    return;
  }

  submitButton.disabled = false;
  submitButton.textContent = `生成${workspace.workspaceTitle}建议`;

  container.innerHTML = workspace.inputSchema
    .map((field) => {
      if (field.inputType === "textarea") {
        return `
          <label>
            ${escapeHtml(field.label)}
            <textarea name="${escapeHtml(field.fieldId)}" rows="3" maxlength="200" placeholder="${escapeHtml(field.placeholder || "")}"></textarea>
          </label>
        `;
      }

      return `
        <label>
          ${escapeHtml(field.label)}
          <input name="${escapeHtml(field.fieldId)}" maxlength="200" placeholder="${escapeHtml(field.placeholder || "")}" />
        </label>
      `;
    })
    .join("");
}

export function renderActionWorkspaceResult(container, result) {
  if (!result?.suggestion) {
    container.innerHTML = `<p class="empty-state">填写工作区输入后，建议区会生成路径内下一轮建议。</p>`;
    return;
  }

  const riskChecks = (result.suggestion.riskChecks || [])
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");

  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">Workspace Suggestion</p>
      <h3>${escapeHtml(result.suggestion.summary)}</h3>
      <p>${escapeHtml(result.suggestion.refinedTask)}</p>
    </div>
    <div class="data-list">
      <div><span>下一步建议</span><strong>${escapeHtml(result.suggestion.nextSuggestion)}</strong></div>
      <div><span>当前关联方向</span><strong>${escapeHtml(result.suggestion.linkedDirection || "待补充")}</strong></div>
      <div><span>可直接用于后续生成的提示语</span><strong>${escapeHtml(result.suggestion.draftPromptLine)}</strong></div>
      <div><span>推荐后续动作</span><strong>${escapeHtml(result.suggestion.recommendedFollowUp)}</strong></div>
    </div>
    <div class="sub-block">
      <strong>风险检查</strong>
      <ul class="detail-list">${riskChecks}</ul>
    </div>
    <div class="split-block">
      <div class="sub-block">
        <strong>采纳后会怎么进入第二轮</strong>
        <ul class="detail-list">
          <li>它会帮助本轮先缩小“最值得改什么”。</li>
          <li>只有明确采纳后，第二轮才会带上这次工作区建议。</li>
          <li>如果标记为不采纳，第二轮会回到纯方向卡与手动反馈。</li>
        </ul>
      </div>
      <div class="sub-block">
        <strong>推荐后续动作</strong>
        <ul class="detail-list">
          <li>先确认本次建议中是否存在可执行动作。</li>
          <li>再回到下方 3 张方向卡，选择最适合继续做第二轮的方向。</li>
          <li>进入第二轮时，只提一个主修改点，结果会更稳定。</li>
        </ul>
      </div>
    </div>
  `;
}

export function renderWorkspaceDecisionStatus(container, saveResult, hasSuggestion = false) {
  if (!saveResult) {
    container.innerHTML = `<p class="empty-state">${
      hasSuggestion
        ? "建议已生成，请先标记是否采纳；只有采纳后才会接入第二轮。"
        : "生成工作区建议后，可标记是否采纳，并保存为中间状态记录。"
    }</p>`;
    return;
  }

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">工作区建议已保存</p>
      <h3>${escapeHtml(saveResult.decision === "accept" ? "已采纳" : "已标记为不采纳")}</h3>
      <p>记录编号：${escapeHtml(saveResult.decisionId)}</p>
      <p class="meta-support"><strong>代码侧记录：</strong>${escapeHtml(saveResult.markdownPath)}</p>
      <div class="sub-block">
        <strong>当前下一步</strong>
        <ul class="detail-list">
          ${
            saveResult.decision === "accept"
              ? `
                <li>这一步建议已采纳，现在回到下方 3 张方向卡继续下一步。</li>
                <li>第二轮会继承这一步建议里的路径提示。</li>
                <li>反馈时优先描述一个最关键的修改变量。</li>
              `
              : `
                <li>这一步建议不会带入第二轮，可以直接按方向卡和手动反馈继续。</li>
                <li>当前建议内容会保留；可修改上方路径输入后重新生成工作区建议。</li>
              `
          }
        </ul>
      </div>
    </div>
  `;
}

export function renderRefineWorkspaceHint(container, workspaceResult, decisionSave) {
  if (!workspaceResult?.suggestion) {
    container.innerHTML = `<p class="empty-state">上方工作区可先补充路径建议；建议生成并采纳后，第二轮才会继承。</p>`;
    return;
  }

  if (decisionSave?.decision !== "accept") {
    const isRejected = decisionSave?.decision === "reject";
    container.innerHTML = `
      <div class="selected-card-box">
        <p class="micro-copy">${isRejected ? "工作区建议未接入" : "工作区建议待确认"}</p>
        <h3>${escapeHtml(workspaceResult.suggestion.summary)}</h3>
        <p>${escapeHtml(
          isRejected
            ? "本次建议已标记为不采纳，第二轮会按方向卡与手动反馈继续。"
            : "建议已生成，采纳后才会接入第二轮优化。"
        )}</p>
        <div class="sub-block">
          <strong>当前更适合怎么做</strong>
          <ul class="detail-list">
            ${
              isRejected
                ? `
                  <li>直接在下方反馈框描述一个主修改点。</li>
                  <li>当前建议内容会保留；可调整工作区路径输入后重新生成建议。</li>
                `
                : `
                  <li>先确认是否采纳上方工作区建议。</li>
                  <li>若暂不采纳，第二轮仍可只依据方向卡和手动反馈生成。</li>
                `
            }
          </ul>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">已接入的工作区建议</p>
      <h3>${escapeHtml(workspaceResult.suggestion.summary)}</h3>
      <p>${escapeHtml(workspaceResult.suggestion.refinedTask)}</p>
      <div class="split-block">
        <div class="sub-block">
          <strong>会自动带入二轮的提示</strong>
          <p>${escapeHtml(workspaceResult.suggestion.draftPromptLine)}</p>
        </div>
        <div class="sub-block">
          <strong>这会怎么影响第二轮</strong>
          <ul class="detail-list">
            <li>系统会优先沿着这条路径解释“为什么要这样改”。</li>
            <li>如果手动反馈和这条建议冲突，第二轮会优先继承明确反馈。</li>
            <li>如果需要纯手动判断，可以不采纳这次建议再继续。</li>
          </ul>
        </div>
      </div>
      <div class="sub-block">
        <strong>当前更适合怎么提反馈</strong>
        <ul class="detail-list">
          <li>先保留这次建议里最值得延续的一点。</li>
          <li>再明确画面、文案或气质的主要调整方向。</li>
          <li>尽量不要同时推翻图、字和构图。</li>
        </ul>
      </div>
    </div>
  `;
}

export function renderCards(cardsContainer, cards, selectedCardId) {
  if (!cards || cards.length === 0) {
    cardsContainer.innerHTML = `<p class="empty-state">首轮方向结果生成后，将展示 3 张可比较的方向卡。</p>`;
    return;
  }

  const primaryCard = cards.find((card) => card.role === "primary") || cards[0];
  const selectedCard = cards.find((card) => card.cardId === selectedCardId) || null;
  const alternativeCount = Math.max(cards.length - 1, 0);

  cardsContainer.innerHTML = `
    <div class="direction-result-header">
      <div>
        <p class="section-kicker">Direction Cards</p>
        <h2>首轮方向结果</h2>
        <p>先比较主方向与备选方向的点击机制，再选择一张进入工作区或二轮修订。</p>
      </div>
      <div class="direction-result-focus">
        <span>当前推荐</span>
        <strong>${escapeHtml(primaryCard.directionLabelUserFacing)}</strong>
        <p>${escapeHtml(
          selectedCard
            ? `已选择：${selectedCard.directionLabelUserFacing}`
            : "尚未选择方向"
        )}</p>
      </div>
      <div class="direction-result-rhythm" aria-label="首轮方向比较顺序">
        <span><strong>01</strong>先看主推荐机制</span>
        <span><strong>02</strong>再比 ${escapeHtml(alternativeCount)} 个备选差异</span>
        <span><strong>03</strong>选定一张进入深化</span>
      </div>
    </div>
  `;

  cardsContainer.innerHTML += cards
    .map((card) => {
      const topSummary = buildCardTopSummary(card);
      const imageCandidates = (card.imageDirectionCandidates || [])
        .map(
          (candidate) => `
            <li>
              <strong>${escapeHtml(candidate.label)}</strong>
              <p>${escapeHtml(candidate.description)}</p>
              <span class="micro-copy">适用：${escapeHtml(candidate.usageCondition)}</span>
            </li>
          `,
        )
        .join("");
      const rankedStrategies = (card.rankedImageStrategies || [])
        .map(
          (candidate, index) => `
            <li>
              <strong>${index + 1}. ${escapeHtml(candidate.label)}</strong>
              <p>${escapeHtml(candidate.priorityReason)}</p>
              <span class="micro-copy">优先分：${escapeHtml(candidate.priorityScore)}</span>
            </li>
          `,
        )
        .join("");
      const isSelected = selectedCardId === card.cardId;
      const isPrimary = card.role === "primary";

      return `
        <article class="card ${isPrimary ? "card-primary" : ""} ${isSelected ? "card-selected" : ""}">
          <div class="card-top">
            <span class="card-role">${escapeHtml(isPrimary ? "推荐主方向" : "备选方向")}</span>
            <span class="card-id">卡片 ${escapeHtml(card.cardId)}</span>
          </div>
          <div class="card-hero">
            <div>
              <h3>${escapeHtml(card.directionLabelUserFacing)}</h3>
              <p class="card-description">${escapeHtml(card.directionDescription)}</p>
            </div>
            <div class="card-state-stack">
              ${isPrimary ? `<span class="card-priority-state">建议优先查看</span>` : ""}
              ${isSelected ? `<span class="card-selection-state">当前已选</span>` : ""}
            </div>
          </div>
          <div class="tag-row">
            ${renderInlineTags(card.signalMatches, "待补匹配信号")}
          </div>
          <div class="card-copy-preview">
            <span>建议先试的封面大字</span>
            <strong>${escapeHtml(card.coverCopyMain)}</strong>
            <p>${escapeHtml(card.titleOptions?.[0] || "待补充")}</p>
          </div>
          <div class="card-summary-grid">
            ${topSummary
              .map(
                (item) => `
                  <div class="card-summary-item">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
          <div class="split-block card-top-blocks">
            <div class="sub-block">
              <strong>素材与执行路径</strong>
              <div class="data-list compact-list card-mini-grid">
                <div><span>素材类型建议</span><strong>${escapeHtml(card.suggestedAssetType || "待补充")}</strong></div>
                <div><span>配图主策略</span><strong>${escapeHtml(card.imageDirection)}</strong></div>
                <div><span>构图建议</span><strong>${escapeHtml(card.compositionDirection)}</strong></div>
                <div><span>色彩/气质</span><strong>${escapeHtml(card.colorMoodDirection || "待补充")}</strong></div>
              </div>
            </div>
            <div class="sub-block">
              <strong>这张卡为什么值得先试</strong>
              <p>${escapeHtml(card.primaryAssetActionReason || "暂无")}</p>
              <div class="tag-row">${renderInlineTags(card.bestFor, "待补内容类型")}</div>
            </div>
          </div>
          <details class="card-details">
            <summary>${escapeHtml(isSelected ? "查看这张已选方向的完整判断依据" : "展开完整判断依据与执行细节")}</summary>
            <div class="card-details-body">
              <div class="sub-block">
                <strong>方向判断依据</strong>
                <div class="tag-row">${renderInlineTags(card.directionSignalChecklist?.matchedSignals || [], "当前命中较少")}</div>
                ${renderSignalGroups(card.directionSignalChecklist?.signalGroups || [])}
              </div>
              <div class="split-block">
                <div class="sub-block">
                  <strong>候选配图方向</strong>
                  <ul class="detail-list">${imageCandidates || "<li>暂无</li>"}</ul>
                </div>
                <div class="sub-block">
                  <strong>建议优先顺序</strong>
                  <ol class="detail-list">${rankedStrategies || "<li>暂无</li>"}</ol>
                </div>
              </div>
              <div class="split-block">
                <div class="sub-block">
                  <strong>常见反馈触发词</strong>
                  <div class="tag-row">${renderInlineTags(card.directionSignalChecklist?.feedbackTriggers || [], "暂无")}</div>
                </div>
                <div class="sub-block">
                  <strong>边界提醒</strong>
                  <ul class="detail-list">${renderListItems(card.directionSignalChecklist?.boundaryRules || [], "暂无")}</ul>
                </div>
              </div>
            </div>
          </details>
          <button
            type="button"
            class="${isSelected ? "card-primary-cta" : "secondary-button"}"
            data-card-id="${escapeHtml(card.cardId)}"
          >
            ${isSelected ? "继续填写第二轮反馈" : "用这张进入第二轮"}
          </button>
        </article>
      `;
    })
    .join("");
}

export function renderSelectedCardSummary(container, analysis, selectedCardId) {
  const card = analysis?.cards?.find((item) => item.cardId === selectedCardId);

  if (!card) {
    container.innerHTML = `<p class="empty-state">先从上方 3 张方向卡里选择一张，再进入第二轮优化。</p>`;
    return;
  }

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">当前选中方向</p>
      <h3>${escapeHtml(card.directionLabelUserFacing)}</h3>
      <p>${escapeHtml(card.directionDescription)}</p>
      ${renderJourneyBridge(
        "首轮选择已完成",
        "当前不是重新选方向，而是在这张已选卡的基础上继续收窄修改重点。",
        "下一步：描述一个最需要调整的主问题",
      )}
      ${renderFlowProgress("refine")}
      <div class="tag-row">${renderInlineTags(card.signalMatches, "待补匹配信号")}</div>
      <div class="data-list compact-list selected-card-grid">
        <div><span>建议先试的封面大字</span><strong>${escapeHtml(card.coverCopyMain)}</strong></div>
        <div><span>二轮最适合先改什么</span><strong>${escapeHtml(card.primaryAssetActionLabel || "待补充")}</strong></div>
      </div>
      <p class="meta-support"><strong>进入第二轮时的反馈方式：</strong>先保留这张卡里最认可的一点，再描述一个最需要调整的地方，系统会更容易给出可继续迭代的结果。</p>
    </div>
  `;
}

export function renderRefinementResult(container, result) {
  const sourceCard = result.sourceCard || null;
  const refined = result.secondRound.refinedCard;
  const mappingExplanation = result.mappingExplanation;
  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">第二轮重点</p>
      <h3>${escapeHtml(refined.cardTitle)}</h3>
      <p>${escapeHtml(refined.directionDescription)}</p>
    </div>
    ${renderJourneyBridge(
      "第二轮结果已生成",
      "这一屏承接的是已选方向和本轮反馈，不是新的随机结果。",
      "下一步：确认保留点，再决定是否继续优化",
    )}
    ${renderFlowProgress("compare")}
    <div class="refinement-kicker-grid">
      <div><span>保留内容</span><strong>${escapeHtml(result.secondRound.preservedElement || "未指定")}</strong></div>
      <div><span>保留强项变量</span><strong>${escapeHtml(result.secondRound.preservedVariable)}</strong></div>
      <div><span>重点修改变量</span><strong>${escapeHtml(result.secondRound.changedVariable)}</strong></div>
      <div><span>改单动作</span><strong>${escapeHtml(result.secondRound.changedAction)}</strong></div>
    </div>
    <div class="split-block refinement-compare-grid">
      <div class="sub-block refinement-compare-card">
        <p class="micro-copy">改前方向</p>
        <h3>${escapeHtml(sourceCard?.directionLabelUserFacing || "待补充")}</h3>
        <div class="refinement-copy-box">
          <span>原始封面大字</span>
          <strong>${escapeHtml(sourceCard?.coverCopyMain || "待补充")}</strong>
          <p>${escapeHtml(sourceCard?.titleOptions?.[0] || "待补充")}</p>
        </div>
        <div class="data-list compact-list refinement-mini-grid">
          <div><span>原始配图方向</span><strong>${escapeHtml(sourceCard?.imageDirection || "待补充")}</strong></div>
          <div><span>原始构图建议</span><strong>${escapeHtml(sourceCard?.compositionDirection || "待补充")}</strong></div>
          <div><span>原始点击逻辑</span><strong>${escapeHtml(sourceCard?.clickReason || "待补充")}</strong></div>
          <div><span>原始风险提醒</span><strong>${escapeHtml(sourceCard?.riskNote || "待补充")}</strong></div>
        </div>
      </div>
      <div class="sub-block refinement-compare-card refinement-compare-card-accent">
        <p class="micro-copy">改后方向</p>
        <h3>${escapeHtml(refined.cardTitle)}</h3>
        <div class="refinement-copy-box refinement-copy-box-accent">
          <span>新的封面大字</span>
          <strong>${escapeHtml(refined.coverCopyMain)}</strong>
          <p>${escapeHtml(refined.titleOptions?.[0] || "待补充")}</p>
        </div>
        <div class="data-list compact-list refinement-mini-grid">
          <div><span>新的配图方向</span><strong>${escapeHtml(refined.imageDirection)}</strong></div>
          <div><span>新的构图建议</span><strong>${escapeHtml(refined.compositionDirection)}</strong></div>
          <div><span>这轮点击逻辑</span><strong>${escapeHtml(refined.clickReason)}</strong></div>
          <div><span>沿用风险提醒</span><strong>${escapeHtml(refined.riskNote || "待补充")}</strong></div>
        </div>
      </div>
    </div>
    <div class="data-list">
      <div><span>工作区建议是否接入</span><strong>${escapeHtml(result.adjustment.workspaceContext ? "已接入" : "未接入")}</strong></div>
      <div><span>命中负向映射</span><strong>${escapeHtml(result.adjustment.feedbackMappingId || "待补充")}</strong></div>
      <div><span>命中正向保留信号</span><strong>${escapeHtml(result.adjustment.feedbackPositiveMappingId || "未命中")}</strong></div>
      <div><span>规则版本</span><strong>${escapeHtml(result.ruleMeta?.version || "unknown")}</strong></div>
      <div><span>这轮目标</span><strong>${escapeHtml(result.secondRound.nextRoundGoal || "待补充")}</strong></div>
      <div><span>识别到的修改请求</span><strong>${escapeHtml(result.adjustment.changeRequest || "待补充")}</strong></div>
      <div><span>保留信号</span><strong>${escapeHtml(mappingExplanation?.preservedSignal || "待补充")}</strong></div>
    </div>
    <div class="sub-block">
      <strong>为什么现在更贴需求</strong>
      <p>${escapeHtml(refined.clickReason)}</p>
    </div>
    <div class="selected-card-box refinement-next-loop-box">
      <p class="micro-copy">继续迭代时的最短路径</p>
      <h3>继续修订时保留关键变量</h3>
      <p>先保留本轮最贴合的一点，再只调整一个主问题。这样第三轮结果会比重新从头描述更稳定。</p>
      <div class="button-row refinement-loop-actions">
        <button type="button" class="ghost-button" data-refinement-follow-up="workspace">
          返回工作区调整
        </button>
        <button type="button" data-refinement-follow-up="continue">
          继续填写下一轮反馈
        </button>
      </div>
    </div>
    <div class="selected-card-box refinement-case-handoff-box">
      <p class="micro-copy">结果沉淀</p>
      <h3>把本轮结果沉淀为案例与规则证据</h3>
      <p>二轮结果确认后，可进入案例维护补充真实案例信息，也可进入复盘驾驶舱查看批次证据和规则修订任务。</p>
      <div class="button-row refinement-loop-actions">
        <button type="button" data-refinement-follow-up="record-case">
          进入案例复盘记录
        </button>
        <button type="button" class="ghost-button" data-refinement-follow-up="review-dashboard">
          进入规则复盘
        </button>
      </div>
    </div>
    <div class="split-block">
      <div class="sub-block">
        <strong>这轮实际改了什么</strong>
        <ul class="detail-list">
          <li>保留：${escapeHtml(result.secondRound.preservedVariable || "待补充")}</li>
          <li>重点改：${escapeHtml(result.secondRound.changedVariable || "待补充")}</li>
          <li>改动动作：${escapeHtml(result.secondRound.changedAction || "待补充")}</li>
          <li>下一轮目标：${escapeHtml(result.secondRound.nextRoundGoal || "待补充")}</li>
        </ul>
      </div>
      <div class="sub-block">
        <strong>继续反馈时的优先表达</strong>
        <ul class="detail-list">
          <li>先说明需要保留的关键点，避免一次性推翻全部变量。</li>
          <li>再说明一个最不满意的点，例如图不贴内容、文案太满、抓眼不足。</li>
          <li>优先只调整一个主变量，下一轮结果会更稳定。</li>
        </ul>
      </div>
    </div>
    <div class="sub-block">
      <strong>可选微调</strong>
      <ul class="detail-list">${renderListItems(result.secondRound.optionalTweaks, "暂无微调建议")}</ul>
    </div>
    <div class="sub-block">
      <strong>修改依据</strong>
      <p>${escapeHtml(mappingExplanation?.summary || "暂无解释")}</p>
      <ul class="detail-list">${renderListItems(mappingExplanation?.explanationLines, "暂无解释线索")}</ul>
    </div>
  `;
}

export function renderPromptPreview(container, preview) {
  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">Prompt 预览</p>
      <h3>${escapeHtml(preview.mode === "full" ? "首轮 + 二轮" : "仅首轮")}</h3>
    </div>
    <h4>第一轮 Prompt</h4>
    <pre>${escapeHtml(preview.firstRoundPrompt)}</pre>
    ${preview.secondRoundPrompt ? `<h4>第二轮 Prompt</h4><pre>${escapeHtml(preview.secondRoundPrompt)}</pre>` : ""}
  `;
}

export function renderLlmDraft(container, result) {
  container.innerHTML =
    result.mode === "first-round"
      ? `
        <div class="result-highlight">
          <p class="micro-copy">LLM Draft · 第一轮</p>
          <h3>${escapeHtml(result.llmDraft.summary)}</h3>
        </div>
        <div class="data-list">
          <div><span>Provider</span><strong>${escapeHtml(result.provider)}</strong></div>
          <div><span>Model</span><strong>${escapeHtml(result.requestContext.model || "mock/no-model")}</strong></div>
          <div><span>模式</span><strong>首轮方向建议</strong></div>
        </div>
        <pre>${escapeHtml((result.llmDraft.highlights || []).join("\n"))}</pre>
      `
      : `
        <div class="result-highlight">
          <p class="micro-copy">LLM Draft · 第二轮</p>
          <h3>${escapeHtml(result.llmDraft.summary)}</h3>
        </div>
        <div class="data-list">
          <div><span>Provider</span><strong>${escapeHtml(result.provider)}</strong></div>
          <div><span>Model</span><strong>${escapeHtml(result.requestContext.model || "mock/no-model")}</strong></div>
          <div><span>优化方向</span><strong>${escapeHtml(result.llmDraft.refinedDirection)}</strong></div>
          <div><span>改单变量</span><strong>${escapeHtml(result.llmDraft.changeFocus)}</strong></div>
          <div><span>新的封面大字</span><strong>${escapeHtml(result.llmDraft.refinedCopy)}</strong></div>
        </div>
        <pre>${escapeHtml((result.llmDraft.highlights || []).join("\n"))}</pre>
      `;
}

export function renderSampleRun(container, payload) {
  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">样例运行结果</p>
      <h3>${escapeHtml(payload.caseMeta.title)}</h3>
    </div>
    <div class="data-list">
      <div><span>来源类型</span><strong>${escapeHtml(payload.caseMeta.sourceType)}</strong></div>
      <div><span>首轮主方向</span><strong>${escapeHtml(payload.analysis.cards[0].directionLabelUserFacing)}</strong></div>
      <div><span>二轮改单变量</span><strong>${escapeHtml(payload.refinement.adjustment.feedbackTargetVariable)}</strong></div>
      <div><span>新的封面大字</span><strong>${escapeHtml(payload.refinement.secondRound.refinedCard.coverCopyMain)}</strong></div>
    </div>
    <div class="sub-block">
      <strong>LLM Draft 摘要</strong>
      <ul class="detail-list">
        <li>${escapeHtml(payload.llmDraftFirstRound.llmDraft.summary)}</li>
        <li>${escapeHtml(payload.llmDraftSecondRound.llmDraft.summary)}</li>
      </ul>
    </div>
  `;
}

export function renderRealCasePreview(container, preview) {
  if (!preview) {
    container.innerHTML = `<p class="empty-state">预览后，结果区会显示即将生成的 indexEntry、record 结构和建议下一步。</p>`;
    return;
  }

  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">Scaffold Preview</p>
      <h3>${escapeHtml(preview.id)} · ${escapeHtml(preview.record.title)}</h3>
      <p>当前只做预览，不直接落库。输入结构确认稳定后，再接正式写入动作。</p>
    </div>
    <div class="data-list compact-list">
      <div><span>索引文件名</span><strong>${escapeHtml(preview.fileName)}</strong></div>
      <div><span>Index 状态</span><strong>${escapeHtml(preview.indexEntry.status)}</strong></div>
      <div><span>平台案例 ID</span><strong>${escapeHtml(preview.indexEntry.platformCaseId)}</strong></div>
      <div><span>默认 Obsidian 路径</span><strong>${escapeHtml(preview.record.tracking.obsidianCasePath)}</strong></div>
      <div><span>复跑优先级</span><strong>${escapeHtml(preview.record.operations.keyCaseRerunPriority)}</strong></div>
      <div><span>维护标签</span><strong>${escapeHtml((preview.record.operations.maintenanceTags || []).join(" / "))}</strong></div>
    </div>
    <div class="split-block">
      <div class="sub-block">
        <strong>即将写入的 indexEntry</strong>
        <pre>${escapeHtml(JSON.stringify(preview.indexEntry, null, 2))}</pre>
      </div>
      <div class="sub-block">
        <strong>即将写入的 record 核心结构</strong>
        <pre>${escapeHtml(JSON.stringify(preview.record, null, 2))}</pre>
      </div>
    </div>
    <div class="sub-block">
      <strong>下一步建议</strong>
      <ul class="detail-list">
        <li>确认 contentTopic、contentGoal、assetDescription 是否足够具体。</li>
        <li>确认这条案例是否值得进入真实案例维护链，而不只是平台笔记。</li>
        <li>确认后，再接正式写入脚本或页面写入动作。</li>
      </ul>
    </div>
  `;
}

export function renderRealCaseCommitResult(container, result) {
  if (!result) {
    container.innerHTML = `<p class="empty-state">确认写入后，结果区会显示实际写入路径和后续动作。</p>`;
    return;
  }

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">真实案例已写入</p>
      <h3>${escapeHtml(result.id)} · ${escapeHtml(result.record.title)}</h3>
      <p>这条案例已经写入代码侧真实案例数据，可继续进入回填与验证链。</p>
      <div class="data-list compact-list">
        <div><span>写入文件</span><strong>${escapeHtml(result.itemPath)}</strong></div>
        <div><span>索引文件</span><strong>${escapeHtml(result.indexPath)}</strong></div>
        <div><span>写入时间</span><strong>${escapeHtml(result.committedAt)}</strong></div>
        <div><span>当前状态</span><strong>${escapeHtml(result.indexEntry.status)}</strong></div>
      </div>
      <div class="sub-block">
        <strong>下一步建议</strong>
        <ul class="detail-list">${renderListItems(result.nextSteps, "暂无")}</ul>
      </div>
    </div>
  `;
}

export function renderRealCaseBatchPreview(container, preview) {
  if (!preview) {
    container.innerHTML =
      `<p class="empty-state">预览后，结果区会显示本次批量录入将新增的真实案例条目和索引变化。</p>`;
    return;
  }

  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">Batch Scaffold Preview</p>
      <h3>本次将新增 ${escapeHtml(preview.created.length)} 条真实案例</h3>
      <p>先确认批量结构是否合理，再统一写入，避免一条条手工录入导致索引混乱。</p>
    </div>
    <div class="data-list compact-list">
      <div><span>新增数量</span><strong>${escapeHtml(preview.created.length)}</strong></div>
      <div><span>写入后索引总数</span><strong>${escapeHtml(preview.nextIndex.length)}</strong></div>
      <div><span>首条案例</span><strong>${escapeHtml(preview.created[0]?.id || "暂无")}</strong></div>
      <div><span>末条案例</span><strong>${escapeHtml(preview.created.at(-1)?.id || "暂无")}</strong></div>
    </div>
    ${renderRealCaseBatchValidationSummary(preview.validationSummary)}
    <div class="sub-block">
      <strong>本次待创建案例</strong>
      <ul class="detail-list">
        ${preview.created
          .map(
            (item) => `
              <li>
                ${escapeHtml(item.id)} · ${escapeHtml(item.record.title)}
                （${escapeHtml(item.indexEntry.platformCaseId)} / ${escapeHtml(item.indexEntry.status)}）
              </li>
            `,
          )
          .join("")}
      </ul>
    </div>
    <div class="split-block">
      <div class="sub-block">
        <strong>第一条案例预览</strong>
        <pre>${escapeHtml(JSON.stringify(preview.created[0]?.record || {}, null, 2))}</pre>
      </div>
      <div class="sub-block">
        <strong>写入后索引尾部预览</strong>
        <pre>${escapeHtml(
          JSON.stringify(preview.nextIndex.slice(-preview.created.length), null, 2),
        )}</pre>
      </div>
    </div>
  `;
}

export function renderRealCaseBatchCommitResult(container, result) {
  if (!result) {
    container.innerHTML =
      `<p class="empty-state">确认批量写入后，结果区会显示新增条数、写入路径和后续动作。</p>`;
    return;
  }

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">批量真实案例已写入</p>
      <h3>本次新增 ${escapeHtml(result.createdCount)} 条真实案例</h3>
      <p>这些案例已经进入代码侧真实案例库，后续可以继续走回填、同步与导出链路。</p>
      <div class="data-list compact-list">
        <div><span>写入时间</span><strong>${escapeHtml(result.committedAt)}</strong></div>
        <div><span>索引文件</span><strong>${escapeHtml(result.indexPath)}</strong></div>
        <div><span>写入文件数</span><strong>${escapeHtml(result.itemPaths?.length || 0)}</strong></div>
        <div><span>新增后索引总数</span><strong>${escapeHtml(result.nextIndex?.length || 0)}</strong></div>
      </div>
      ${renderRealCaseBatchValidationSummary(result.validationSummary)}
      <div class="sub-block">
        <strong>本次新增案例</strong>
        <ul class="detail-list">
          ${(result.created || [])
            .map(
              (item, index) => `
                <li>
                  ${escapeHtml(item.id)} · ${escapeHtml(item.record.title)}
                  → ${escapeHtml(result.itemPaths?.[index] || "待补路径")}
                </li>
              `,
            )
            .join("")}
        </ul>
      </div>
      <div class="sub-block">
        <strong>下一步建议</strong>
        <ul class="detail-list">${renderListItems(result.nextSteps, "暂无")}</ul>
      </div>
    </div>
  `;
}

export function renderRealCaseBatchWorksheetResult(container, result) {
  if (!result) {
    container.innerHTML =
      `<p class="empty-state">生成批量回填工作单后，结果区会显示工作单预览和 Obsidian 导出信息。</p>`;
    return;
  }

  const exportMeta = result.targetPath
    ? `
      <div class="data-list compact-list">
        <div><span>导出目标</span><strong>${escapeHtml(result.targetPath)}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.sourceMarkdownPath || "待补")}</strong></div>
        <div><span>导出时间</span><strong>${escapeHtml(result.exportedAt || "待补")}</strong></div>
        <div><span>导出动作</span><strong>${escapeHtml(result.overwrite?.actionLabel || "待补")}</strong></div>
      </div>
    `
    : `
      <div class="data-list compact-list">
        <div><span>批次标签</span><strong>${escapeHtml(result.batchLabel)}</strong></div>
        <div><span>案例数</span><strong>${escapeHtml(result.createdCount)}</strong></div>
        <div><span>Obsidian 目标</span><strong>${escapeHtml(result.obsidianDraft?.targetPath || "待补")}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.obsidianDraft?.sourceMarkdownPath || "待补")}</strong></div>
      </div>
    `;

  const historyRows = (result.history?.rows || result.history?.recentExports || [])
    .map(
      (item) => `
        <li>
          ${escapeHtml(item.exportedAt || "待补时间")}
          · ${escapeHtml(item.actionLabel || "待补动作")}
          · ${escapeHtml(item.readbackOk ? "读回已确认" : "读回待确认")}
        </li>
      `,
    )
    .join("");

  const latestStatus = result.latestExportStatus
    ? `
      <div class="sub-block">
        <strong>最近一次导出状态</strong>
        <div class="data-list compact-list">
          <div><span>批次标签</span><strong>${escapeHtml(result.latestExportStatus.batchLabel || result.batchLabel || "待补")}</strong></div>
          <div><span>导出动作</span><strong>${escapeHtml(result.latestExportStatus.actionLabel || "待补")}</strong></div>
          <div><span>导出时间</span><strong>${escapeHtml(result.latestExportStatus.exportedAt || "待补")}</strong></div>
          <div><span>读回一致性</span><strong>${escapeHtml(result.latestExportStatus.readbackOk ? "已确认" : "待确认")}</strong></div>
        </div>
      </div>
    `
    : "";

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">${result.exportId ? "批量回填工作单已导出" : "批量回填工作单预览"}</p>
      <h3>${escapeHtml(result.batchLabel)} · ${escapeHtml(result.createdCount)} 条案例</h3>
      <p>这份工作单把当前批次的缺口、优先动作和逐条下一步整理成可继续执行的底稿。</p>
      ${exportMeta}
      ${latestStatus}
      <div class="sub-block">
        <strong>工作单 Markdown 预览</strong>
        <pre>${escapeHtml(result.worksheetMarkdown || result.obsidianDraft?.markdown || "暂无")}</pre>
      </div>
      <div class="sub-block">
        <strong>最近导出记录</strong>
        <ul class="detail-list">${historyRows || "<li>当前还没有最近导出记录。</li>"}</ul>
      </div>
    </div>
  `;
}

export function renderRealCaseBatchRunRecordResult(container, result) {
  if (!result) {
    container.innerHTML =
      `<p class="empty-state">生成批次试跑记录后，结果区会显示试跑记录预览和 Obsidian 导出信息。</p>`;
    return;
  }

  const exportMeta = result.targetPath
    ? `
      <div class="data-list compact-list">
        <div><span>导出目标</span><strong>${escapeHtml(result.targetPath)}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.sourceMarkdownPath || "待补")}</strong></div>
        <div><span>导出时间</span><strong>${escapeHtml(result.exportedAt || "待补")}</strong></div>
        <div><span>导出动作</span><strong>${escapeHtml(result.overwrite?.actionLabel || "待补")}</strong></div>
      </div>
    `
    : `
      <div class="data-list compact-list">
        <div><span>批次标签</span><strong>${escapeHtml(result.batchLabel)}</strong></div>
        <div><span>案例数</span><strong>${escapeHtml(result.createdCount)}</strong></div>
        <div><span>Obsidian 目标</span><strong>${escapeHtml(result.obsidianDraft?.targetPath || "待补")}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.obsidianDraft?.sourceMarkdownPath || "待补")}</strong></div>
      </div>
  `;
  const frictionCategories = result.frictionTemplate || [];
  const manualReviewGuide = result.manualReviewGuide || null;
  const latestManualReviewStatus = result.latestManualReviewStatus || null;

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">${result.exportId ? "批次试跑记录已导出" : "批次试跑记录预览"}</p>
      <h3>${escapeHtml(result.batchLabel)} · ${escapeHtml(result.createdCount)} 条案例</h3>
      <p>这份记录用于沉淀一整批真实案例试跑后的观察、摩擦点和是否进入 UI 优化讨论。</p>
      ${exportMeta}
      <div class="split-block">
        <div class="sub-block">
          <strong>${escapeHtml(manualReviewGuide?.headline || "先补关键人工判断")}</strong>
          <p>${escapeHtml(manualReviewGuide?.reason || "先补关键人工判断，再做跨批次汇总。")}</p>
          <ul class="detail-list">
            ${
              manualReviewGuide?.fillOrder?.length
                ? manualReviewGuide.fillOrder
                    .map(
                      (item) =>
                        `<li>${escapeHtml(item.rank)}. ${escapeHtml(item.shortLabel)} · ${escapeHtml(item.prompt)}</li>`,
                    )
                    .join("")
                : "<li>当前还没有人工判断填写顺序。</li>"
            }
          </ul>
        </div>
        <div class="sub-block">
          <strong>填写顺序提示</strong>
          <ul class="detail-list">
            ${
              manualReviewGuide?.suggestedWorkflow?.length
                ? manualReviewGuide.suggestedWorkflow
                    .map((item) => `<li>${escapeHtml(item)}</li>`)
                    .join("")
                : "<li>先写最卡环节，再判断是否已经到 UI 时机。</li>"
            }
          </ul>
          <p class="micro-copy">${escapeHtml(manualReviewGuide?.completionRule || "")}</p>
        </div>
      </div>
      <div class="sub-block">
        <strong>最近一次人工结论覆盖状态</strong>
        <ul class="detail-list">
          ${
            latestManualReviewStatus
              ? [
                  `<li>最近导出：${escapeHtml(latestManualReviewStatus.exportedAt || "待补")} · ${escapeHtml(latestManualReviewStatus.actionLabel || "待补")}</li>`,
                  `<li>当前覆盖：${escapeHtml(latestManualReviewStatus.hasManualConclusion ? `已填写 ${latestManualReviewStatus.filledFieldCount} 项` : "上次导出仍未填写人工结论")}</li>`,
                  `<li>已填关键字段：${escapeHtml(latestManualReviewStatus.filledKeyFields?.map((item) => item.label).join(" / ") || "暂无")}</li>`,
                  `<li>还缺关键字段：${escapeHtml(latestManualReviewStatus.missingKeyFields?.map((item) => item.label).join(" / ") || "无")}</li>`,
                ].join("")
              : "<li>这批目前还没有已导出的人工结论覆盖状态。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>推荐先记录的摩擦点类别</strong>
        <ul class="detail-list">
          ${
            frictionCategories.length
              ? frictionCategories
                  .slice(0, 4)
                  .map(
                    (item) =>
                      `<li>${escapeHtml(item.label)}：${escapeHtml(item.priorityReason || "待补原因")}</li>`,
                  )
                  .join("")
              : "<li>当前还没有结构化摩擦点类别。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>填写时可先参考的信号</strong>
        <ul class="detail-list">
          ${
            manualReviewGuide?.supportingSignals?.length
              ? manualReviewGuide.supportingSignals
                  .map((item) => `<li>${escapeHtml(item)}</li>`)
                  .join("")
              : "<li>当前还没有可用信号。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>试跑记录 Markdown 预览</strong>
        <pre>${escapeHtml(result.runRecordMarkdown || result.obsidianDraft?.markdown || "暂无")}</pre>
      </div>
    </div>
  `;
}

export function renderUiOptimizationReadinessResult(container, result) {
  if (!result) {
    container.innerHTML =
      `<p class="empty-state">生成 UI 就绪度报告后，结果区会显示当前是否建议正式进入 UI 优化讨论。</p>`;
    return;
  }

  const report = result.report || {};
  const summary = report.summary || {};
  const passedChecks = report.passedChecks || [];
  const evidenceRows = [
    ...((report.evidence?.batchFillWorksheetStatuses || []).map((item) => ({
      type: "工作单",
      batchLabel: item.batchLabel || item.normalizedLabel || "待补批次",
      readbackLabel: item.readbackOk ? "读回已确认" : "读回待确认",
      exportedAt: item.exportedAt || "待补时间",
    })) || []),
    ...((report.evidence?.batchRunRecordStatuses || []).map((item) => ({
      type: "试跑记录",
      batchLabel: item.batchLabel || item.normalizedLabel || "待补批次",
      readbackLabel: item.readbackOk ? "读回已确认" : "读回待确认",
      exportedAt: item.exportedAt || "待补时间",
    })) || []),
  ];
  const exportMeta = result.targetPath
    ? `
      <div class="data-list compact-list">
        <div><span>导出目标</span><strong>${escapeHtml(result.targetPath)}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.sourceMarkdownPath || "待补")}</strong></div>
        <div><span>导出时间</span><strong>${escapeHtml(result.exportedAt || "待补")}</strong></div>
        <div><span>读回一致性</span><strong>${escapeHtml(result.readback?.ok ? "已确认" : "待确认")}</strong></div>
      </div>
    `
    : `
      <div class="data-list compact-list">
        <div><span>当前判断</span><strong>${escapeHtml(report.readinessLabel || "待补")}</strong></div>
        <div><span>readiness_level</span><strong>${escapeHtml(report.readinessLevel || "待补")}</strong></div>
        <div><span>Obsidian 目标</span><strong>${escapeHtml(result.obsidianDraft?.targetPath || "待补")}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.obsidianDraft?.sourceMarkdownPath || "待补")}</strong></div>
      </div>
    `;

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">${result.exportId ? "UI 优化进入条件报告已导出" : "UI 优化进入条件报告预览"}</p>
      <h3>${escapeHtml(report.readinessLabel || "待补判断")}</h3>
      <p>先看真实批次证据是否足够，再决定现在该继续补试跑，还是已经适合正式讨论 UI 优化。</p>
      ${exportMeta}
      <div class="split-block">
        <div class="sub-block">
          <strong>当前汇总</strong>
          <div class="data-list compact-list">
            <div><span>工作单批次数</span><strong>${escapeHtml(summary.batchFillWorksheetBatchCount ?? "0")}</strong></div>
            <div><span>工作单读回确认</span><strong>${escapeHtml(summary.batchFillReadbackConfirmedCount ?? "0")}</strong></div>
            <div><span>试跑记录批次数</span><strong>${escapeHtml(summary.batchRunRecordBatchCount ?? "0")}</strong></div>
            <div><span>试跑记录读回确认</span><strong>${escapeHtml(summary.batchRunReadbackConfirmedCount ?? "0")}</strong></div>
            <div><span>已写人工结论批次</span><strong>${escapeHtml(summary.manualReviewReviewedBatchCount ?? "0")}</strong></div>
            <div><span>人工完整覆盖批次</span><strong>${escapeHtml(summary.manualReviewFullyCoveredBatchCount ?? "0")}</strong></div>
            <div><span>跨批次信号</span><strong>${escapeHtml(report.crossBatchSignal?.label || "待补")}</strong></div>
            <div><span>重复摩擦点类别数</span><strong>${escapeHtml(report.crossBatchSignal?.repeatedCategories ?? "0")}</strong></div>
          </div>
        </div>
        <div class="sub-block">
          <strong>检查项</strong>
          <ul class="detail-list">
            ${passedChecks.length
              ? passedChecks
                  .map(
                    (item) =>
                      `<li>${escapeHtml(item.passed ? "已满足" : "待满足")} · ${escapeHtml(item.label)}</li>`,
                  )
                  .join("")
              : "<li>当前还没有检查项。</li>"}
          </ul>
        </div>
      </div>
      <div class="split-block">
        <div class="sub-block">
          <strong>当前风险</strong>
          <ul class="detail-list">${renderListItems(report.risks || [], "当前没有明显结构性风险。")}</ul>
        </div>
        <div class="sub-block">
          <strong>下一步动作</strong>
          <ul class="detail-list">${renderListItems(report.nextActions || [], "暂无建议动作。")}</ul>
        </div>
      </div>
      <div class="sub-block">
        <strong>跨批次重复信号</strong>
        <ul class="detail-list">
          <li>${escapeHtml(report.crossBatchSignal?.reason || "待补")}</li>
          <li>最强重复类别：${escapeHtml(report.crossBatchSignal?.topRepeatedCategoryLabel || "待补充")}</li>
          <li>纳入汇总批次数：${escapeHtml(report.crossBatchSignal?.totalBatches ?? "0")}</li>
          <li>人工完整覆盖批次：${escapeHtml(summary.manualReviewFullyCoveredBatchCount ?? "0")}</li>
          <li>人工仍未补齐批次：${escapeHtml(summary.manualReviewPartiallyCoveredBatchCount ?? "0")}</li>
        </ul>
      </div>
      <div class="sub-block">
        <strong>当前证据</strong>
        <ul class="detail-list">
          ${evidenceRows.length
            ? evidenceRows
                .map(
                  (item) =>
                    `<li>${escapeHtml(item.type)} / ${escapeHtml(item.batchLabel)} · ${escapeHtml(item.readbackLabel)} · ${escapeHtml(item.exportedAt)}</li>`,
                )
                .join("")
            : "<li>当前还没有可用证据，请先导出批量工作单或批次试跑记录。</li>"}
        </ul>
      </div>
      <div class="sub-block">
        <strong>报告 Markdown 预览</strong>
        <pre>${escapeHtml(result.readinessMarkdown || result.obsidianDraft?.markdown || "暂无")}</pre>
      </div>
    </div>
  `;
}

export function renderBatchRunFrictionSummaryResult(container, result) {
  if (!result) {
    container.innerHTML =
      `<p class="empty-state">生成跨批次摩擦点汇总后，结果区会显示多批次重复出现的摩擦点类别。</p>`;
    return;
  }

  const report = result.report || {};
  const summary = report.summary || {};
  const topCategories = report.topCategories || [];
  const topActions = report.topRecommendedActions || [];
  const batchRows = report.batchRows || [];
  const exportMeta = result.targetPath
    ? `
      <div class="data-list compact-list">
        <div><span>导出目标</span><strong>${escapeHtml(result.targetPath)}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.sourceMarkdownPath || "待补")}</strong></div>
        <div><span>导出时间</span><strong>${escapeHtml(result.exportedAt || "待补")}</strong></div>
        <div><span>读回一致性</span><strong>${escapeHtml(result.readback?.ok ? "已确认" : "待确认")}</strong></div>
      </div>
    `
    : `
      <div class="data-list compact-list">
        <div><span>当前判断</span><strong>${escapeHtml(report.uiDiscussionSignal?.label || "待补")}</strong></div>
        <div><span>signal status</span><strong>${escapeHtml(report.uiDiscussionSignal?.status || "待补")}</strong></div>
        <div><span>Obsidian 目标</span><strong>${escapeHtml(result.obsidianDraft?.targetPath || "待补")}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.obsidianDraft?.sourceMarkdownPath || "待补")}</strong></div>
      </div>
    `;

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">${result.exportId ? "跨批次摩擦点汇总已导出" : "跨批次摩擦点汇总预览"}</p>
      <h3>${escapeHtml(report.uiDiscussionSignal?.label || "待补判断")}</h3>
      <p>这份汇总不是看某一批，而是看哪些摩擦点已经跨批次重复出现，更适合成为正式 UI 讨论的输入。</p>
      ${exportMeta}
      <div class="split-block">
        <div class="sub-block">
          <strong>汇总</strong>
          <div class="data-list compact-list">
            <div><span>批次数</span><strong>${escapeHtml(summary.totalBatches ?? "0")}</strong></div>
            <div><span>案例总数</span><strong>${escapeHtml(summary.totalCases ?? "0")}</strong></div>
            <div><span>重复类别数</span><strong>${escapeHtml(summary.repeatedCategories ?? "0")}</strong></div>
            <div><span>缺少工作单导出批次</span><strong>${escapeHtml(summary.worksheetMissingCount ?? "0")}</strong></div>
            <div><span>已写人工结论批次</span><strong>${escapeHtml(summary.reviewedBatchCount ?? "0")}</strong></div>
            <div><span>完全未写人工结论批次</span><strong>${escapeHtml(summary.missingManualReviewCount ?? "0")}</strong></div>
          </div>
        </div>
        <div class="sub-block">
          <strong>当前判断原因</strong>
          <ul class="detail-list">
            <li>${escapeHtml(report.uiDiscussionSignal?.reason || "待补")}</li>
          </ul>
        </div>
      </div>
      <div class="split-block">
        <div class="sub-block">
          <strong>最常重复的摩擦点类别</strong>
          <ul class="detail-list">
            ${
              topCategories.length
                ? topCategories
                    .slice(0, 5)
                    .map(
                      (item) =>
                        `<li>${escapeHtml(item.label)} · ${escapeHtml(item.batchCount)} 批 · 平均优先分 ${escapeHtml(item.averagePriorityScore)}</li>`,
                    )
                    .join("")
                : "<li>当前还没有可汇总的摩擦点类别。</li>"
            }
          </ul>
        </div>
        <div class="sub-block">
          <strong>最常重复的推荐动作</strong>
          <ul class="detail-list">
            ${
              topActions.length
                ? topActions
                    .slice(0, 5)
                    .map(
                      (item) =>
                        `<li>${escapeHtml(item.label)} · ${escapeHtml(item.count)} 次 · 最高优先分 ${escapeHtml(item.maxPriorityScore)}</li>`,
                    )
                    .join("")
                : "<li>当前还没有可汇总的推荐动作。</li>"
            }
          </ul>
        </div>
      </div>
      <div class="sub-block">
        <strong>各批次对照</strong>
        <ul class="detail-list">
          ${
            batchRows.length
              ? batchRows
                  .map(
                    (item) =>
                      `<li>${escapeHtml(item.batchLabel)} · ${escapeHtml(item.createdCount)} 条 · 摩擦点：${escapeHtml(item.topCategoryLabels.join(" / ") || "暂无")} · 工作单导出${escapeHtml(item.hasWorksheetExport ? (item.worksheetReadbackOk ? "已确认" : "待确认") : "缺失")} · 人工结论${escapeHtml(item.hasManualConclusion ? `已写 ${item.manualReviewFilledFields.length} 项` : "未写")}</li>`,
                  )
                  .join("")
              : "<li>当前还没有跨批次记录可对照。</li>"
          }
        </ul>
      </div>
      <div class="split-block">
        <div class="sub-block">
          <strong>人工判断覆盖度</strong>
          <ul class="detail-list">
            ${
              report.manualReview?.keyFieldCoverage &&
              Object.keys(report.manualReview.keyFieldCoverage).length
                ? Object.values(report.manualReview.keyFieldCoverage)
                    .map((item) => `<li>${escapeHtml(item.label)} · ${escapeHtml(item.count)} 批已填写</li>`)
                    .join("")
                : "<li>当前还没有可统计的关键人工判断字段。</li>"
            }
          </ul>
        </div>
        <div class="sub-block">
          <strong>建议优先补的批次</strong>
          <ul class="detail-list">
            ${
              report.manualReview?.pendingBatchRows?.length
                ? report.manualReview.pendingBatchRows
                    .slice(0, 5)
                    .map((item) => {
                      const missingLabels = (item.missingKeyFields || [])
                        .map((field) => field.label)
                        .join(" / ");

                      return `<li>${escapeHtml(item.batchLabel)} · ${escapeHtml(item.hasManualConclusion ? `还缺 ${missingLabels || "待确认"}` : "整批还没写人工结论")}</li>`;
                    })
                    .join("")
                : "<li>当前所有批次都已覆盖关键人工判断字段。</li>"
            }
          </ul>
        </div>
      </div>
      <div class="sub-block">
        <strong>汇总 Markdown 预览</strong>
        <pre>${escapeHtml(result.summaryMarkdown || result.obsidianDraft?.markdown || "暂无")}</pre>
      </div>
    </div>
  `;
}

function buildRuleConsolidationDecision(report = {}) {
  const summary = report.summary || {};
  const uiReadiness = report.uiReadiness || {};
  const coverageTrend = report.coverageTrend || {};
  const crossBatchSignal = report.crossBatchSignal || {};
  const missingManualReviewCount = Number(summary.missingManualReviewCount || 0);
  const fullyCoveredBatchCount = Number(summary.fullyCoveredBatchCount || 0);
  const repeatedCategories = Number(summary.repeatedCategories || 0);
  const isUiReady = uiReadiness.readinessLevel === "ready";
  const isCoverageStable = coverageTrend.status === "stabilizing";
  const hasRepeatedSignal = repeatedCategories >= 2;

  const evidence = [
    `UI 时机：${uiReadiness.readinessLabel || "暂不建议进入 UI 讨论"}`,
    `人工复盘趋势：${coverageTrend.label || "人工复盘仍然不足"}`,
    `重复摩擦点类别：${repeatedCategories}`,
    `未写人工结论批次：${missingManualReviewCount}`,
  ];

  if (isUiReady && isCoverageStable && hasRepeatedSignal) {
    return {
      title: "进入主链路局部 UI 优化讨论",
      statusLabel: "可以进入局部优化",
      summary:
        "当前 UI readiness、人工复盘覆盖和重复摩擦点信号已经同时达标，下一步适合把重复摩擦点转成规则修订任务，并围绕主链路做局部 UI 优化。",
      ruleAction: "提炼重复摩擦点，形成规则修订任务",
      webV2Decision: "暂不新建 Web v2，先验证主链路局部优化",
      visualDecision: "允许进入主链路视觉与交互局部重排",
      handoffTitle: "规则修订交接",
      handoffItems: [
        "规则修订任务单：提炼重复摩擦点、命中规则和调整理由。",
        "关键样例复跑：优先选择已完整人工复盘的批次，验证规则调整前后差异。",
        "局部 UI 优化：仅围绕主路径结果区、决策区和复盘入口做小范围重排。",
      ],
      evidence,
    };
  }

  if (missingManualReviewCount > 0 || fullyCoveredBatchCount === 0) {
    return {
      title: "先补人工复盘，再重跑判断",
      statusLabel: "暂不进入重构",
      summary:
        "当前规则沉淀仍缺人工复盘证据。此时启动 Web v2 或完整视觉重构会把问题带向审美判断，下一步应先补齐关键人工字段。",
      ruleAction: "补齐人工复盘字段，生成待补任务和安全写回预览",
      webV2Decision: "不启动 Web v2",
      visualDecision: "不启动完整视觉重构",
      handoffTitle: "证据补齐交接",
      handoffItems: [
        "人工复盘待补任务：先补齐当前批次缺失字段。",
        "安全写回预览：正式写回前必须保留可读的确认材料。",
        "复盘重跑：补齐后重新生成跨批次摩擦点、UI readiness 和复盘看板。",
      ],
      evidence,
    };
  }

  return {
    title: "继续积累跨批次证据",
    statusLabel: "保持维护模式",
    summary:
      "当前已有一定复盘基础，但重复摩擦点或 UI readiness 还不足以支持结构性重构。下一步应继续补真实批次，并把稳定问题先沉淀到规则说明。",
    ruleAction: "继续沉淀规则说明，等待重复信号变强",
    webV2Decision: "暂不新建 Web v2",
    visualDecision: "仅保留小范围文案与层级优化",
    handoffTitle: "样本积累交接",
    handoffItems: [
      "新增真实批次：继续补可代表真实使用路径的案例。",
      "跨批次摩擦点：等待重复类别稳定后再转入规则修订。",
      "局部优化观察：仅记录高频路径，不提前启动完整视觉改版。",
    ],
    evidence,
  };
}

export function renderBatchReviewDashboardResult(container, result) {
  if (!result) {
    container.innerHTML =
      `<p class="empty-state">生成复盘看板后，将显示最需补齐的批次、人工复盘趋势和下一步动作。</p>`;
    return;
  }

  const report = result.report || {};
  const summary = report.summary || {};
  const ruleDecision = buildRuleConsolidationDecision(report);
  const priorityRows = report.priorityRows || [];
  const manualReviewTaskCard = report.manualReviewTaskCard || {};
  const manualReviewTaskHandoff = report.manualReviewTaskHandoff || {};
  const uiRecheckPlan = report.uiRecheckPlan || {};
  const ruleRevisionSignal = report.ruleRevisionSignal || {};
  const keyCaseRerunHandoff = report.keyCaseRerunHandoff || {};
  const formalWriteGate = report.formalWriteGate || {};
  const followUpChecklist = report.followUpChecklist || {};
  const followUpProgress = result.followUpProgress || {};
  const formalWriteReadiness = result.formalWriteReadiness || null;
  const formalWriteExport = result.formalWriteExport || null;
  const manualConfirmationSafePreviewAdoptionPacket =
    result.manualConfirmationSafePreviewAdoptionPacket || null;
  const manualConfirmationSafePreviewWritePrecheck =
    result.manualConfirmationSafePreviewWritePrecheck || null;
  const manualConfirmationSafePreviewWriteProjection =
    result.manualConfirmationSafePreviewWriteProjection || null;
  const manualConfirmationSafePreviewWriteApply =
    result.manualConfirmationSafePreviewWriteApply || null;
  const manualFormalWriteExecutionPrecheck =
    result.manualFormalWriteExecutionPrecheck || null;
  const manualFormalWriteExecutionPacket =
    result.manualFormalWriteExecutionPacket || null;
  const manualFormalWritePostExecutionAcceptance =
    result.manualFormalWritePostExecutionAcceptance || null;
  const piEngineExecutionPositionAudit =
    result.piEngineExecutionPositionAudit || null;
  const formalWriteFollowUpPlan = result.formalWriteFollowUpPlan || null;
  const progressSummary = buildFollowUpProgressSummary(followUpChecklist, followUpProgress);
  const nextFollowUp = progressSummary.nextEntry;
  const backfillStatus = result.manualTaskPreview?.backfillPreview?.status || "";
  const hasManualTaskFields = Boolean((manualReviewTaskCard.fieldTasks || []).length);
  const hasManualBackfill = Boolean(
    (result.manualTaskPreview?.backfillPreview?.filledFieldLabels || []).length,
  );
  const canContinueWithSuggestedDraft = hasManualTaskFields;
  const isSuggestedDraftFlow = canContinueWithSuggestedDraft && !hasManualBackfill;
  const writebackDraftButtonLabel = isSuggestedDraftFlow
    ? "导出建议态写回草稿"
    : "导出真实批次试跑结论写回草稿";
  const safeWriteButtonLabel = isSuggestedDraftFlow
    ? "导出建议态安全写回预览"
    : "导出真实批次试跑记录安全写回预览";
  const formalWriteHint = isSuggestedDraftFlow
    ? "当前尚未填写人工判断，可先导出建议态草稿和安全写回预览，用于评估系统默认建议是否具备继续处理价值。"
    : "正式写回需在待补任务、回流预览、安全写回预览和人工确认全部完成后开放。";
  const safeWriteStatus = formalWriteReadiness?.latestSafeWriteStatus || null;
  const manualConfirmationDecision = formalWriteReadiness?.manualConfirmationDecision || null;
  const manualDecisionAdopted = Boolean(
    manualConfirmationDecision?.decisionStatus === "adopt-recommended" &&
      manualConfirmationDecision?.canProceedToSafePreviewWrite,
  );
  const safeWritePreviewStatus = safeWriteStatus?.targetPath
    ? safeWriteStatus.readbackOk && safeWriteStatus.matchedExpectedContent
      ? "读回已确认"
      : "内容待复查"
    : formalWriteGate.targetPath
      ? formalWriteGate.readbackOk && formalWriteGate.matchedExpectedContent
        ? "读回已确认"
        : "内容待复查"
      : "待生成";
  const safeWritePatchSource =
    safeWriteStatus?.patchSourceLabel ||
    safeWriteStatus?.parsed?.patchSourceLabel ||
    formalWriteGate.patchSourceLabel ||
    "暂无";
  const safeWriteManualConclusion =
    safeWriteStatus?.manualReviewConclusion || safeWriteStatus?.parsed?.manualReviewConclusion || "";
  const canShowFormalWriteAction = Boolean(safeWriteStatus?.canProceedToFormalWrite && manualDecisionAdopted);
  const safeWriteFormalPermission = safeWriteStatus
    ? canShowFormalWriteAction
      ? "可进入正式写回"
      : safeWriteStatus.canProceedToFormalWrite
        ? "待人工决策"
        : "待人工确认"
    : formalWriteGate.formalWritePermission || "暂无";
  const formalWriteGateProgress = formalWriteReadiness
    ? renderWritebackGateProgress(
        buildWritebackGateProgress(
          formalWriteReadiness,
          safeWriteStatus,
          canShowFormalWriteAction,
        ),
      )
    : "";
  const formalGateChecklist = formalWriteGate.confirmationChecklist || [];
  const writebackGateSteps = [
    {
      label: "待补任务卡",
      status: hasManualTaskFields ? "已生成" : "待生成",
    },
    {
      label: "人工回流预览",
      status: hasManualBackfill ? "已生成" : "待补人工判断",
    },
    {
      label: "安全写回预览",
      status: safeWritePreviewStatus,
    },
    {
      label: "正式写回状态",
      status: formalWriteReadiness?.statusLabel || formalWriteGate.label || "待检查",
    },
    {
      label: "人工决策",
      status: manualDecisionAdopted
        ? "推荐块已采用"
        : manualConfirmationDecision
          ? "等待采用"
          : "待读取",
    },
  ];
  const suiteExportMeta = result.suiteExport
    ? `
      <div class="sub-block">
        <strong>本轮复盘套件</strong>
        <div class="data-list compact-list">
          <div><span>套件导出</span><strong>${escapeHtml(result.suiteExport.targetPath || "待补")}</strong></div>
          <div><span>套件时间</span><strong>${escapeHtml(result.suiteExport.exportedAt || "待补")}</strong></div>
          <div><span>套件读回</span><strong>${escapeHtml(result.suiteExport.readback?.ok ? "已确认" : "待确认")}</strong></div>
          <div><span>包含内容</span><strong>${escapeHtml("摩擦点汇总 / UI时机报告 / 复盘看板")}</strong></div>
        </div>
      </div>
    `
    : "";
  const exportMeta = result.targetPath
    ? `
      <div class="data-list compact-list">
        <div><span>导出目标</span><strong>${escapeHtml(result.targetPath)}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.sourceMarkdownPath || "待补")}</strong></div>
        <div><span>导出时间</span><strong>${escapeHtml(result.exportedAt || "待补")}</strong></div>
        <div><span>读回一致性</span><strong>${escapeHtml(result.readback?.ok ? "已确认" : "待确认")}</strong></div>
      </div>
    `
    : `
      <div class="data-list compact-list">
        <div><span>当前状态</span><strong>${escapeHtml(report.coverageTrend?.label || "待补")}</strong></div>
        <div><span>UI 时机</span><strong>${escapeHtml(report.uiReadiness?.readinessLabel || "待补")}</strong></div>
        <div><span>跨批次信号</span><strong>${escapeHtml(report.crossBatchSignal?.label || "待补")}</strong></div>
        <div><span>规则修订任务</span><strong>${escapeHtml(ruleRevisionSignal.label || "暂无规则修订任务")}</strong></div>
        <div><span>当前看板</span><strong>${escapeHtml("预览中")}</strong></div>
      </div>
    `;

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">${result.exportId ? "批次复盘看板已导出" : "批次复盘看板预览"}</p>
      <h3>${escapeHtml(report.coverageTrend?.label || "待补判断")}</h3>
      <p>近期人工复盘覆盖状态、跨批次重复信号和 UI 时机判断已收束为统一复盘面板。</p>
      ${exportMeta}
      ${suiteExportMeta}
      <div class="split-block">
        <div class="sub-block">
          <strong>当前汇总</strong>
          <div class="data-list compact-list">
            <div><span>批次数</span><strong>${escapeHtml(summary.totalBatches ?? "0")}</strong></div>
            <div><span>已写人工结论批次</span><strong>${escapeHtml(summary.reviewedBatchCount ?? "0")}</strong></div>
            <div><span>人工完整覆盖批次</span><strong>${escapeHtml(summary.fullyCoveredBatchCount ?? "0")}</strong></div>
            <div><span>人工半填批次</span><strong>${escapeHtml(summary.partiallyCoveredBatchCount ?? "0")}</strong></div>
            <div><span>未写人工结论批次</span><strong>${escapeHtml(summary.missingManualReviewCount ?? "0")}</strong></div>
            <div><span>重复摩擦点类别</span><strong>${escapeHtml(summary.repeatedCategories ?? "0")}</strong></div>
            <div><span>规则修订任务数</span><strong>${escapeHtml(ruleRevisionSignal.taskCount ?? "0")}</strong></div>
          </div>
        </div>
        <div class="sub-block">
          <strong>当前判断</strong>
          <ul class="detail-list">
            <li>UI 时机：${escapeHtml(report.uiReadiness?.readinessLabel || "待补")}</li>
            <li>跨批次信号：${escapeHtml(report.crossBatchSignal?.label || "待补")}</li>
            <li>${escapeHtml(report.coverageTrend?.reason || "待补")}</li>
          </ul>
        </div>
      </div>
      <div class="sub-block rule-task-signal-panel">
        <strong>规则修订任务信号</strong>
        <div class="data-list compact-list">
          <div><span>当前状态</span><strong>${escapeHtml(ruleRevisionSignal.label || "暂无规则修订任务")}</strong></div>
          <div><span>任务数量</span><strong>${escapeHtml(ruleRevisionSignal.taskCount ?? 0)}</strong></div>
          <div><span>来源样本</span><strong>${escapeHtml(ruleRevisionSignal.sourceSampleCount ?? 0)}</strong></div>
          <div><span>优先级分布</span><strong>${escapeHtml(ruleRevisionSignal.prioritySummary || "P1 0 / P2 0 / P3 0")}</strong></div>
          <div><span>复跑承接</span><strong>${escapeHtml(keyCaseRerunHandoff.label || "等待规则任务后再安排复跑")}</strong></div>
        </div>
        <ul class="detail-list">
          ${
            (ruleRevisionSignal.topTasks || []).length
              ? ruleRevisionSignal.topTasks
                  .map(
                    (task) => `
                      <li>
                        ${escapeHtml(task.taskId || "")}｜${escapeHtml(task.priority || "")}｜${escapeHtml(task.taskTitle || "")}
                        <div class="micro-copy">建议映射：${escapeHtml(task.suggestedMappingId || "待确认")} · 关联样本：${escapeHtml((task.caseIds || []).join(" / ") || "暂无")}</div>
                      </li>
                    `,
                  )
                  .join("")
              : "<li>当前没有可展示的规则修订任务。</li>"
          }
        </ul>
      </div>
      <div class="sub-block rule-task-signal-panel">
        <strong>关键样例复跑承接</strong>
        <p class="micro-copy">${escapeHtml(keyCaseRerunHandoff.summary || "当前还没有规则任务可进入复跑。")}</p>
        <div class="data-list compact-list">
          <div><span>当前状态</span><strong>${escapeHtml(keyCaseRerunHandoff.label || "等待规则任务后再安排复跑")}</strong></div>
          <div><span>候选样例</span><strong>${escapeHtml((keyCaseRerunHandoff.candidateCaseIds || []).join(" / ") || "暂无")}</strong></div>
          <div><span>下游刷新</span><strong>${escapeHtml((keyCaseRerunHandoff.downstreamRefreshTargets || []).join(" / ") || "暂无")}</strong></div>
          ${
            keyCaseRerunHandoff.latestRun
              ? `
                <div><span>最近复跑计划</span><strong>${escapeHtml(keyCaseRerunHandoff.latestRun.planId || "待确认")}</strong></div>
                <div><span>最近复跑样例</span><strong>${escapeHtml(keyCaseRerunHandoff.latestRun.rerunCaseCount ?? 0)}</strong></div>
                <div><span>变化样例</span><strong>${escapeHtml(keyCaseRerunHandoff.latestRun.changedCaseCount ?? 0)}</strong></div>
                <div><span>下游变化</span><strong>${escapeHtml(keyCaseRerunHandoff.latestRun.downstreamChangedCount ?? 0)}</strong></div>
              `
              : ""
          }
        </div>
        <ul class="detail-list">
          ${
            (keyCaseRerunHandoff.commandSequence || []).length
              ? keyCaseRerunHandoff.commandSequence
                  .map((command) => `<li><code>${escapeHtml(command)}</code></li>`)
                  .join("")
              : "<li>当前没有可执行的复跑命令建议。</li>"
          }
        </ul>
      </div>
      <div class="rule-decision-panel">
        <div class="rule-decision-heading">
          <div>
            <p class="micro-copy">Rule & Architecture Decision</p>
            <h3>${escapeHtml(ruleDecision.title)}</h3>
          </div>
          <span>${escapeHtml(ruleDecision.statusLabel)}</span>
        </div>
        <p>${escapeHtml(ruleDecision.summary)}</p>
        <div class="rule-decision-grid">
          <div>
            <span>规则沉淀判断</span>
            <strong>${escapeHtml(ruleDecision.ruleAction)}</strong>
          </div>
          <div>
            <span>Web v2 判断</span>
            <strong>${escapeHtml(ruleDecision.webV2Decision)}</strong>
          </div>
          <div>
            <span>视觉重构判断</span>
            <strong>${escapeHtml(ruleDecision.visualDecision)}</strong>
          </div>
        </div>
        <ul class="detail-list">
          ${ruleDecision.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
      <div class="rule-handoff-panel">
        <div>
          <p class="micro-copy">Rule Handoff</p>
          <strong>${escapeHtml(ruleDecision.handoffTitle || "规则沉淀交接")}</strong>
        </div>
        <div class="rule-handoff-grid">
          ${(ruleDecision.handoffItems || [])
            .map(
              (item, index) => `
                <article>
                  <span>${escapeHtml(String(index + 1).padStart(2, "0"))}</span>
                  <p>${escapeHtml(item)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="sub-block">
        <strong>当前最该补的批次</strong>
        <ul class="detail-list">
          ${
            priorityRows.length
              ? priorityRows
                  .slice(0, 5)
                  .map(
                    (item) =>
                      `<li>${escapeHtml(item.batchLabel)} · ${escapeHtml(item.urgencyLabel)} · 缺 ${escapeHtml(item.missingFieldLabels.join(" / ") || "待确认")} · 摩擦点 ${escapeHtml(item.topCategoryLabels.join(" / ") || "暂无")}</li>`,
                  )
                  .join("")
              : "<li>当前没有待补批次，人工复盘相对完整。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>下一步动作</strong>
        <ul class="detail-list">${renderListItems(report.nextActions || [], "暂无建议动作。")}</ul>
      </div>
      <div class="sub-block">
        <strong>${escapeHtml(uiRecheckPlan.title || "人工复盘补齐后的再判断链路")}</strong>
        <p class="micro-copy">${escapeHtml(uiRecheckPlan.summary || "补齐人工复盘后，再重新生成 UI readiness 和复盘判断。")}</p>
        <div class="data-list compact-list">
          <div><span>当前状态</span><strong>${escapeHtml(uiRecheckPlan.statusLabel || "待补")}</strong></div>
          <div><span>UI 时机</span><strong>${escapeHtml(report.uiReadiness?.readinessLabel || "待补")}</strong></div>
          <div><span>人工趋势</span><strong>${escapeHtml(report.coverageTrend?.label || "待补")}</strong></div>
          <div><span>跨批次信号</span><strong>${escapeHtml(report.crossBatchSignal?.label || "待补")}</strong></div>
        </div>
        <ul class="detail-list">
          ${
            (uiRecheckPlan.blockers || []).length
              ? uiRecheckPlan.blockers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
              : "<li>当前没有额外阻塞，可直接进入下一步讨论。</li>"
          }
        </ul>
        <ul class="detail-list">
          ${
            (uiRecheckPlan.steps || []).length
              ? uiRecheckPlan.steps
                  .map(
                    (step) => `
                      <li>
                        ${escapeHtml(step.label || "")}
                        <span class="micro-copy">[${escapeHtml(step.status || "upcoming")}]</span>
                        ${step.note ? `<div class="micro-copy">${escapeHtml(step.note)}</div>` : ""}
                      </li>
                    `,
                  )
                  .join("")
              : "<li>当前还没有生成再判断链路。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>${escapeHtml(manualReviewTaskCard.title || "人工复盘待补任务卡")}</strong>
        <p class="micro-copy">${escapeHtml(manualReviewTaskCard.summary || "当前没有待补人工复盘任务。")}</p>
        <div class="data-list compact-list">
          <div><span>当前状态</span><strong>${escapeHtml(manualReviewTaskCard.statusLabel || "待补")}</strong></div>
          <div><span>目标批次</span><strong>${escapeHtml(manualReviewTaskCard.targetBatchLabel || "暂无")}</strong></div>
          <div><span>草稿状态</span><strong>${escapeHtml(manualReviewTaskHandoff.label || "可导出人工复盘草稿")}</strong></div>
          <div><span>草稿读回</span><strong>${escapeHtml(manualReviewTaskHandoff.readbackOk ? "已确认" : "待生成")}</strong></div>
          <div><span>当前摩擦点</span><strong>${escapeHtml((manualReviewTaskCard.topCategoryLabels || []).join(" / ") || "待补")}</strong></div>
          <div><span>优先补信息</span><strong>${escapeHtml((manualReviewTaskCard.topActionLabels || []).join(" / ") || "待补")}</strong></div>
        </div>
        <ul class="detail-list">
          ${
            (manualReviewTaskCard.fieldTasks || []).length
              ? manualReviewTaskCard.fieldTasks
                  .map(
                    (task) => `
                      <li>
                        ${escapeHtml(task.label || "")}：${escapeHtml(task.prompt || "")}
                        <div class="micro-copy">填写提示：${escapeHtml(task.answerHint || "待补")}</div>
                        ${
                          task.startSuggestion
                            ? `<div class="micro-copy">起笔建议：${escapeHtml(task.startSuggestion)}</div>`
                            : ""
                        }
                        ${
                          task.suggestedDraft
                            ? `<div class="micro-copy">建议初稿：${escapeHtml(task.suggestedDraft)}</div>`
                            : ""
                        }
                      </li>
                    `,
                  )
                  .join("")
              : "<li>当前没有待补字段，可转向新增样本或重跑判断。</li>"
          }
        </ul>
        ${
          (manualReviewTaskCard.fieldTasks || []).length
            ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="export-manual-review-task-card">导出人工复盘待补任务</button></div>`
            : ""
        }
        ${
          (hasManualTaskFields && hasManualBackfill)
            ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="export-manual-review-backfill">导出人工复盘回流预览</button></div>`
            : ""
        }
        ${
          canContinueWithSuggestedDraft
            ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="export-manual-review-writeback-draft">${escapeHtml(writebackDraftButtonLabel)}</button></div>`
            : ""
        }
        ${
          canContinueWithSuggestedDraft
            ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="export-manual-review-safe-write">${escapeHtml(safeWriteButtonLabel)}</button></div>`
            : ""
        }
        ${
          canContinueWithSuggestedDraft
            ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="check-manual-review-formal-write-readiness">检查写回门禁</button></div>`
            : ""
        }
        ${
          canShowFormalWriteAction
            ? renderFormalWriteControlledAction(true)
            : ""
        }
        <div class="writeback-gate-panel">
          <div class="writeback-gate-heading">
            <div>
              <p class="micro-copy">Writeback Gate</p>
              <strong>人工复盘写回闸门</strong>
            </div>
            <span>${escapeHtml(formalWriteReadiness?.statusLabel || formalWriteGate.label || "待检查")}</span>
          </div>
          <div class="writeback-gate-grid">
            ${writebackGateSteps
              .map(
                (step) => `
                  <div>
                    <span>${escapeHtml(step.label)}</span>
                    <strong>${escapeHtml(step.status)}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
          ${
            formalGateChecklist.length
              ? `<ul class="detail-list">
                  ${formalGateChecklist
                    .map(
                      (item) => `
                        <li>
                          ${escapeHtml(item.label || "")}
                          <span class="micro-copy">[${escapeHtml(item.status || "pending")}]</span>
                          <div class="micro-copy">${escapeHtml(item.detail || "待补")}</div>
                        </li>
                      `,
                    )
                    .join("")}
                </ul>`
              : ""
          }
        </div>
        <p class="micro-copy">${escapeHtml(formalWriteHint)}</p>
      </div>
      ${
        formalWriteReadiness
          ? `
      <div class="sub-block" data-formal-write-status-panel>
        <strong>正式写回状态</strong>
        <div class="data-list compact-list">
          <div><span>当前状态</span><strong>${escapeHtml(formalWriteReadiness.statusLabel || formalWriteReadiness.status || "待补")}</strong></div>
          <div><span>状态码</span><strong>${escapeHtml(formalWriteReadiness.status || "待补")}</strong></div>
          <div><span>目标批次</span><strong>${escapeHtml(formalWriteReadiness.latestSafeWriteStatus?.targetBatchLabel || "暂无")}</strong></div>
          <div><span>改写来源</span><strong>${escapeHtml(safeWritePatchSource)}</strong></div>
          <div><span>最近安全预览</span><strong>${escapeHtml(formalWriteReadiness.latestSafeWriteStatus?.targetPath || "暂无")}</strong></div>
          <div><span>预览读回</span><strong>${escapeHtml(safeWriteStatus ? (safeWriteStatus.readbackOk ? "已确认" : "待确认") : "暂无")}</strong></div>
          <div><span>内容一致性</span><strong>${escapeHtml(safeWriteStatus ? (safeWriteStatus.matchedExpectedContent ? "已确认" : "待复查") : "暂无")}</strong></div>
          <div><span>人工结论</span><strong>${escapeHtml(safeWriteManualConclusion || "待补")}</strong></div>
          <div><span>人工决策</span><strong>${escapeHtml(manualConfirmationDecision?.decisionLabel || "待读取")}</strong></div>
          <div><span>写回许可</span><strong>${escapeHtml(safeWriteFormalPermission)}</strong></div>
        </div>
        ${formalWriteGateProgress}
        ${renderManualConfirmationSafePreviewAdoptionPacket(manualConfirmationSafePreviewAdoptionPacket)}
        ${renderManualConfirmationSafePreviewWritePrecheck(manualConfirmationSafePreviewWritePrecheck, manualConfirmationSafePreviewWriteApply)}
        ${renderManualConfirmationSafePreviewWriteProjection(manualConfirmationSafePreviewWriteProjection)}
        ${renderPiEngineExecutionPositionAudit(piEngineExecutionPositionAudit)}
        ${renderManualFormalWriteExecutionPrecheck(manualFormalWriteExecutionPrecheck)}
        ${renderManualFormalWriteExecutionPacket(manualFormalWriteExecutionPacket)}
        ${renderManualFormalWritePostExecutionAcceptance(manualFormalWritePostExecutionAcceptance)}
        ${renderFormalWriteFollowUpPlan(formalWriteFollowUpPlan)}
        <p class="micro-copy">${escapeHtml(formalWriteReadiness.summary || "待补")}</p>
        <div class="button-row">
          <a class="link-button ghost-button" href="#writeback-gate-overview">查看写回门禁总览</a>
        </div>
      </div>
    `
          : ""
      }
      ${
        formalWriteExport
          ? `
      <div class="sub-block" data-formal-write-followup-panel>
        <strong>写回后承接任务</strong>
        <div class="data-list compact-list">
          <div><span>正式写回</span><strong>${escapeHtml(formalWriteExport.readback?.ok ? "已完成" : "待确认")}</strong></div>
          <div><span>目标记录</span><strong>${escapeHtml(formalWriteExport.targetPath || "暂无")}</strong></div>
          <div><span>人工结论</span><strong>${escapeHtml(formalWriteExport.manualReviewConclusion || "待补")}</strong></div>
          <div><span>任务数量</span><strong>${escapeHtml((formalWriteExport.followUpTasks || []).length)}</strong></div>
        </div>
        <ul class="detail-list">
          ${
            (formalWriteExport.followUpTasks || []).length
              ? formalWriteExport.followUpTasks
                  .map(
                    (task) =>
                      `<li>
                        ${escapeHtml(task.label || "")}：${escapeHtml(task.summary || "")}
                        <div class="micro-copy">任务状态：${escapeHtml(formatFormalWriteTaskStatus(task.status))} · 任务类型：${escapeHtml(formatFormalWriteTaskType(task.taskType))} · 执行方式：${escapeHtml(formatFormalWriteExecutionMode(task.executionMode))}</div>
                        ${renderFormalWriteTaskEvidence(task.evidence)}
                        <div class="micro-copy">${escapeHtml(formatFormalWriteTaskNextStep(task.taskType))}</div>
                      </li>`,
                  )
                  .join("")
              : "<li>当前还没有生成写回后承接任务。</li>"
          }
        </ul>
        ${renderFormalWriteFollowUpPlan(formalWriteFollowUpPlan)}
      </div>
    `
          : ""
      }
      <div class="sub-block">
        <strong>当前推进状态</strong>
        <div class="data-list compact-list">
          <div><span>可执行动作</span><strong>${escapeHtml(progressSummary.totalActionableCount)}</strong></div>
          <div><span>本轮已完成</span><strong>${escapeHtml(progressSummary.completedCount)}</strong></div>
          <div><span>剩余动作</span><strong>${escapeHtml(progressSummary.remainingCount)}</strong></div>
          <div><span>执行中</span><strong>${escapeHtml(progressSummary.runningCount)}</strong></div>
          <div><span>已完成阶段</span><strong>${escapeHtml(progressSummary.completedPhaseCount)} / ${escapeHtml(progressSummary.totalPhaseCount)}</strong></div>
          <div><span>当前阶段</span><strong>${escapeHtml(progressSummary.nextPhaseLabel || "已全部完成")}</strong></div>
        </div>
        ${
          progressSummary.transitionSummary
            ? `<p class="micro-copy">${escapeHtml(progressSummary.transitionSummary)}</p>`
            : `<p class="micro-copy">当前还没有已完成的复盘动作。</p>`
        }
        <ul class="detail-list">
          ${
            (progressSummary.phaseSummaries || []).length
              ? progressSummary.phaseSummaries
                  .map(
                    (phase) => `
                      <li>
                        ${escapeHtml(phase.phaseLabel)} · ${escapeHtml(phase.completedCount)} / ${escapeHtml(phase.totalCount)}
                        ${renderPhaseStatus(phase.status)}
                      </li>
                    `,
                  )
                  .join("")
              : "<li>当前还没有可展示的阶段进度。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>当前推荐下一步</strong>
        ${
          nextFollowUp
            ? `
              <div class="result-highlight review-next-step-card" data-review-next-step-card>
                <p>${escapeHtml(nextFollowUp.item.label)}</p>
                <p class="micro-copy">当前阶段：${escapeHtml(nextFollowUp.phaseLabel)}</p>
                ${
                  progressSummary.upcomingSummary
                    ? `<p class="micro-copy">${escapeHtml(progressSummary.upcomingSummary)}</p>`
                    : ""
                }
              </div>
              ${
                nextFollowUp.item.actionId && nextFollowUp.item.actionLabel
                  ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="${escapeHtml(nextFollowUp.item.actionId)}">${escapeHtml(nextFollowUp.item.actionLabel)}</button></div>`
                  : ""
              }
            `
            : `<p class="empty-state">当前带入口的复盘动作都已执行过，本轮可以转向人工补充或新增真实批次。</p>`
        }
      </div>
      <div class="sub-block">
        <strong>本轮执行记录</strong>
        <ul class="detail-list">
          ${
            (progressSummary.recentCompletedEntries || []).length
              ? progressSummary.recentCompletedEntries
                  .map(
                    (entry) => `
                      <li>
                        ${escapeHtml(entry.item.label)} · ${escapeHtml(entry.phaseLabel)}
                        <span class="micro-copy">完成于 ${escapeHtml(formatProgressTimestamp(entry.status?.updatedAt))}</span>
                      </li>
                    `,
                  )
                  .join("")
              : "<li>当前还没有已完成的复盘动作记录。</li>"
          }
        </ul>
      </div>
      <div class="sub-block">
        <strong>复盘后操作清单</strong>
        ${
          followUpChecklist.phases?.length
            ? followUpChecklist.phases
                .map(
                  (phase) => `
                    <div class="sub-block">
                      <p class="micro-copy">${escapeHtml(phase.label)}</p>
                      <ul class="detail-list">
                        ${
                          (phase.items || []).length
                            ? (phase.items || [])
                                .map(
                                  (item) => `
                                    <li>
                                      ${escapeHtml(item.label || "")}
                                      ${renderFollowUpStatus(followUpProgress[item.actionId || ""])}
                                      ${
                                        item.actionId && item.actionLabel
                                          ? `<div class="button-row"><button type="button" class="ghost-button" data-review-followup-action="${escapeHtml(item.actionId)}">${escapeHtml(item.actionLabel)}</button></div>`
                                          : ""
                                      }
                                    </li>
                                  `,
                                )
                                .join("")
                            : "<li>暂无</li>"
                        }
                      </ul>
                    </div>
                  `,
                )
                .join("")
            : `<p class="empty-state">当前还没有生成复盘后操作清单。</p>`
        }
      </div>
      <div class="sub-block">
        <strong>看板 Markdown 预览</strong>
        <pre>${escapeHtml(result.dashboardMarkdown || "暂无")}</pre>
      </div>
    </div>
  `;
}

export function renderRealCaseLibrary(
  container,
  cases,
  latestCommittedId = "",
  laneFilter = "all",
) {
  const realCases = (cases || []).filter((item) => item.sourceType === "real");

  if (!realCases.length) {
    container.innerHTML = `<p class="empty-state">当前还没有可展示的真实案例。</p>`;
    return;
  }

  const laneCounts = realCases.reduce((accumulator, item) => {
    const key = item.overviewMeta?.laneLabel || "待进入维护";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const actionableCount = realCases.filter((item) => item.overviewMeta?.isActionable).length;
  const visibleCases =
    laneFilter === "all"
      ? realCases
      : laneFilter === "actionable"
        ? realCases.filter((item) => item.overviewMeta?.isActionable)
      : realCases.filter((item) => (item.overviewMeta?.laneLabel || "待进入维护") === laneFilter);

  const cards = visibleCases
    .map((item) => {
      const isLatest = latestCommittedId && item.id === latestCommittedId;
      return `
        <article class="summary-card ${isLatest ? "summary-card-accent" : ""}">
          <p class="micro-copy">${escapeHtml(isLatest ? "Latest Commit" : "Real Case")}</p>
          <h3>${escapeHtml(item.id)} · ${escapeHtml(item.title)}</h3>
          <div class="tag-row">
            <span class="tag">${escapeHtml(item.overviewMeta?.laneLabel || "待进入维护")}</span>
            <span class="tag">${escapeHtml(item.readinessStatus || "待补充")}</span>
          </div>
          <div class="data-list compact-list">
            <div><span>平台</span><strong>${escapeHtml(item.platform || "待补充")}</strong></div>
            <div><span>平台案例 ID</span><strong>${escapeHtml(item.platformCaseId || "待补充")}</strong></div>
            <div><span>复跑优先级</span><strong>${escapeHtml(item.keyCaseRerunPriority)}</strong></div>
            <div><span>维护标签</span><strong>${escapeHtml((item.maintenanceTags || []).join(" / ") || "暂无")}</strong></div>
            <div><span>回填进度</span><strong>${escapeHtml(item.readinessCompletedChecks ?? "0")} / ${escapeHtml(item.readinessTotalChecks ?? "0")}</strong></div>
            <div><span>最近导出</span><strong>${escapeHtml(item.latestExportStatus?.actionLabel || "尚未导出")}</strong></div>
            <div><span>导出一致性</span><strong>${escapeHtml(item.latestExportStatus ? (item.latestExportStatus.readbackOk ? "已确认" : "待确认") : "暂无")}</strong></div>
          </div>
          <p class="micro-copy">${escapeHtml(item.latestExportStatus?.exportedAt || "当前还没有这条案例的 Obsidian 导出记录")}</p>
          <div class="button-row panel-inner-block">
            <button
              type="button"
              class="ghost-button"
              data-real-case-action="sync-preview"
              data-case-id="${escapeHtml(item.id)}"
              data-platform-case-id="${escapeHtml(item.platformCaseId || "")}"
            >
              查看这条的同步预览
            </button>
            <button
              type="button"
              class="ghost-button"
              data-real-case-action="fill-preview"
              data-case-id="${escapeHtml(item.id)}"
            >
              查看这条先补什么
            </button>
            <button
              type="button"
              class="ghost-button"
              data-real-case-action="fill-sheet"
              data-case-id="${escapeHtml(item.id)}"
            >
              查看完整回填工作单
            </button>
            <button
              type="button"
              data-real-case-action="export-obsidian-fill"
              data-export-mode="overwrite"
              data-case-id="${escapeHtml(item.id)}"
            >
              覆盖导出到 Obsidian
            </button>
            <button
              type="button"
              class="ghost-button"
              data-real-case-action="export-obsidian-fill"
              data-export-mode="copy"
              data-case-id="${escapeHtml(item.id)}"
            >
              新建副本到 Obsidian
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  const filterTags = [
    `<button type="button" class="${laneFilter === "all" ? "" : "ghost-button"}" data-real-case-lane-filter="all">全部 · ${escapeHtml(realCases.length)}</button>`,
    `<button type="button" class="${laneFilter === "actionable" ? "" : "ghost-button"}" data-real-case-lane-filter="actionable">只看待处理 · ${escapeHtml(actionableCount)}</button>`,
    ...Object.entries(laneCounts).map(
      ([label, count]) =>
        `<button type="button" class="${laneFilter === label ? "" : "ghost-button"}" data-real-case-lane-filter="${escapeHtml(label)}">${escapeHtml(label)} · ${escapeHtml(count)}</button>`,
    ),
  ].join("");

  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">Real Case Snapshot</p>
      <h3>当前共有 ${escapeHtml(realCases.length)} 条真实案例</h3>
      <p>这块已经开始承担轻量维护总览的作用，优先把更该先补、更该先导出的案例排在前面。</p>
      <div class="button-row">
        ${filterTags}
      </div>
    </div>
    <div class="cards">${cards || '<p class="empty-state">当前筛选下还没有匹配的真实案例。</p>'}</div>
  `;
}

export function renderRealCaseMaintenancePreview(container, result) {
  if (!result) {
    container.innerHTML = `<p class="empty-state">从真实案例概览选择一条案例后，结果区会显示当前最该先补的字段。</p>`;
    return;
  }

  const topItems = (result.fillSheet.topPriorityItems || [])
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.label)}</strong>
          <p>${escapeHtml(item.prompt)}</p>
          <span class="micro-copy">代码字段：${escapeHtml(item.codeField || "待补充")}｜Obsidian 对应：${escapeHtml(item.obsidianField || "待补充")}</span>
        </li>
      `,
    )
    .join("");

  container.innerHTML = `
    <div class="result-highlight">
      <p class="micro-copy">Maintenance Preview</p>
      <h3>${escapeHtml(result.caseId)} · ${escapeHtml(result.title)}</h3>
      <p>这块先回答“这条真实案例当前最该先补什么”，后续再扩成完整工作单或维护面板。</p>
    </div>
    <div class="data-list compact-list">
      <div><span>当前就绪度</span><strong>${escapeHtml(result.readiness.status)}</strong></div>
      <div><span>已完成检查</span><strong>${escapeHtml(result.readiness.completedChecks)} / ${escapeHtml(result.readiness.totalChecks)}</strong></div>
      <div><span>缺失字段数</span><strong>${escapeHtml(result.fillSheet.missingCount)}</strong></div>
      <div><span>平台案例 ID</span><strong>${escapeHtml(result.fillSheet.platformCaseId || "待补充")}</strong></div>
    </div>
    <div class="sub-block">
      <strong>当前最该先补的字段</strong>
      <ul class="detail-list">${topItems || "<li>暂无优先字段</li>"}</ul>
    </div>
    <div class="sub-block">
      <strong>完整回填工作单预览</strong>
      <pre>${escapeHtml(result.fillSheetMarkdown || "暂无")}</pre>
    </div>
    <div class="sub-block">
      <strong>Obsidian 草稿预览</strong>
      <div class="data-list compact-list">
        <div><span>建议落点</span><strong>${escapeHtml(result.obsidianDraft?.targetPath || "待补充")}</strong></div>
        <div><span>代码底稿来源</span><strong>${escapeHtml(result.obsidianDraft?.sourceMarkdownPath || "待补充")}</strong></div>
      </div>
      <pre>${escapeHtml(result.obsidianDraft?.markdown || "暂无")}</pre>
    </div>
  `;
}

export function renderRealCaseExportResult(container, result) {
  if (!result) {
    container.innerHTML = `<p class="empty-state">真实案例回填工作单结构确认后，可以导出成 Obsidian 可继续编辑的草稿。</p>`;
    return;
  }

  const historyRows = (result.history?.recentExports || [])
    .map(
      (item) => `
        <li>
          <strong>${escapeHtml(item.exportId)}</strong>
          <p>${escapeHtml(item.exportedAt)}｜${escapeHtml(item.actionLabel)}</p>
          <span class="micro-copy">一致性：${escapeHtml(item.matchedExpectedContent ? "已确认" : "待复查")}</span>
        </li>
      `,
    )
    .join("");

  container.innerHTML = `
    <div class="selected-card-box">
      <p class="micro-copy">Obsidian Export Complete</p>
      <h3>${escapeHtml(result.caseId)} · ${escapeHtml(result.title)}</h3>
      <p>这条回填工作单已经导出为 Obsidian 草稿，可直接继续补写。</p>
      <div class="data-list compact-list">
        <div><span>导出路径</span><strong>${escapeHtml(result.targetPath)}</strong></div>
        <div><span>代码底稿</span><strong>${escapeHtml(result.sourceMarkdownPath)}</strong></div>
        <div><span>生成日期</span><strong>${escapeHtml(result.generatedDate)}</strong></div>
        <div><span>导出模式</span><strong>${escapeHtml(result.overwrite?.requestedMode === "copy" ? "新建副本" : "覆盖当前")}</strong></div>
        <div><span>导出动作</span><strong>${escapeHtml(result.overwrite?.actionLabel || "待补充")}</strong></div>
        <div><span>上次首行</span><strong>${escapeHtml(result.overwrite?.previousHeading || "首次导出")}</strong></div>
        <div><span>上次长度</span><strong>${escapeHtml(result.overwrite?.previousLength ?? "待补充")}</strong></div>
        <div><span>读回确认</span><strong>${escapeHtml(result.readback?.ok ? "已确认" : "待确认")}</strong></div>
        <div><span>读回首行</span><strong>${escapeHtml(result.readback?.persistedHeading || "待补充")}</strong></div>
        <div><span>读回长度</span><strong>${escapeHtml(result.readback?.persistedLength ?? "待补充")}</strong></div>
      </div>
      <div class="sub-block">
        <strong>最近导出记录</strong>
        <ul class="detail-list">${historyRows || "<li>暂无导出历史</li>"}</ul>
        <p class="micro-copy">导出日志：${escapeHtml(result.history?.latestLogPath || "待补充")}</p>
      </div>
    </div>
  `;
}

export function renderPlatformReview(container, review) {
  const linkedCases = (review.linkedCases || []).map((item) => `${item.caseId} · ${item.title}`);
  const weakFields = review.quality?.weakFields || [];
  const firstTask = review.actionPlan?.tasks?.[0];
  const changedFields = review.syncPreview?.syncSummary?.changedFields || [];

  container.innerHTML = `
    <div class="summary-card">
      <h3>单案例复核</h3>
      <div class="data-list compact-list">
        <div><span>平台案例</span><strong>${escapeHtml(review.platformCaseId)}</strong></div>
        <div><span>完整度状态</span><strong>${escapeHtml(review.summary.completenessStatus)}（${escapeHtml(review.summary.completedChecks)}/${escapeHtml(review.summary.totalChecks)}）</strong></div>
        <div><span>质量状态</span><strong>${escapeHtml(review.summary.qualityStatus)}（可用 ${escapeHtml(review.quality?.usableCount || 0)}/${escapeHtml(review.quality?.totalChecks || 0)}）</strong></div>
        <div><span>优先补字段</span><strong>${escapeHtml((review.summary.topPriorityItems || []).join(" / ") || "暂无")}</strong></div>
      </div>
      <div class="split-block">
        <div class="sub-block">
          <strong>已映射真实案例</strong>
          <ul class="detail-list">${renderListItems(linkedCases, "暂无")}</ul>
        </div>
        <div class="sub-block">
          <strong>已填但偏弱</strong>
          <ul class="detail-list">${renderListItems(weakFields, "暂无")}</ul>
        </div>
      </div>
      <div class="sub-block">
        <strong>第一步建议</strong>
        <p>${escapeHtml(firstTask ? `${firstTask.label}｜${firstTask.prompt}` : "暂无")}</p>
      </div>
      <div class="sub-block">
        <strong>Sync 后变化字段</strong>
        <div class="tag-row">${renderInlineTags(changedFields, "暂无")}</div>
      </div>
    </div>
  `;
}

export function renderPlatformBatchReview(container, review) {
  const rows = (review.topPriorityRows || []).map(
    (item, index) => `
      <li>
        <strong>${index + 1}. ${escapeHtml(item.platformCaseId)}</strong>
        <span>${escapeHtml(item.completenessStatus)}</span>
        <p>优先补：${escapeHtml((item.topPriorityItems || []).join(" / ") || "暂无")}</p>
      </li>
    `,
  );

  container.innerHTML = `
    <div class="summary-card">
      <h3>批量复核总览</h3>
      <div class="data-list compact-list">
        <div><span>总数</span><strong>${escapeHtml(review.summary.totalCases)}</strong></div>
        <div><span>待回填</span><strong>${escapeHtml(review.summary.pendingCount)}</strong></div>
        <div><span>部分回填</span><strong>${escapeHtml(review.summary.partialCount)}</strong></div>
        <div><span>可同步</span><strong>${escapeHtml(review.summary.readyCount)}</strong></div>
      </div>
      <ul class="detail-list">${rows.join("") || "<li>暂无平台案例</li>"}</ul>
    </div>
  `;
}

export function renderPlatformSyncPreview(container, preview) {
  container.innerHTML = `
    <div class="summary-card">
      <h3>同步预览</h3>
      <div class="data-list compact-list">
        <div><span>真实案例</span><strong>${escapeHtml(preview.caseId)} · ${escapeHtml(preview.title)}</strong></div>
        <div><span>平台案例</span><strong>${escapeHtml(preview.platformCaseId)}</strong></div>
        <div><span>同步前</span><strong>${escapeHtml(preview.syncSummary.readinessBefore.status)}（${escapeHtml(preview.syncSummary.readinessBefore.completedChecks)}/${escapeHtml(preview.syncSummary.readinessBefore.totalChecks)}）</strong></div>
        <div><span>同步后</span><strong>${escapeHtml(preview.syncSummary.readinessAfter.status)}（${escapeHtml(preview.syncSummary.readinessAfter.completedChecks)}/${escapeHtml(preview.syncSummary.readinessAfter.totalChecks)}）</strong></div>
      </div>
      <div class="sub-block">
        <strong>将被更新字段</strong>
        <div class="tag-row">${renderInlineTags(preview.syncSummary.changedFields, "暂无")}</div>
      </div>
    </div>
  `;
}

export function setStatus(container, message) {
  container.textContent = message;
}
