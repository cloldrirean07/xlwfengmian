const REQUIRED_ARTIFACTS = [
  {
    artifactId: "requirement-spec",
    label: "Requirement Spec",
    pathKey: "requirementSpecPath",
    summary: "正式需求规格已生成，可作为 PI Engine 实现输入。",
  },
  {
    artifactId: "prd-information-architecture",
    label: "PRD 信息架构",
    pathKey: "prdInformationArchitecturePath",
    summary: "PRD 信息架构确认材料已归档。",
  },
  {
    artifactId: "architecture-plan",
    label: "架构计划",
    pathKey: "architecturePlanPath",
    summary: "产品线重做架构计划已生成，当前按维护模式推进。",
  },
  {
    artifactId: "safe-preview-confirmation",
    label: "安全预览确认块",
    pathKey: "safePreviewConfirmationRecordPath",
    summary: "安全预览确认块已写入并通过读回。",
  },
  {
    artifactId: "formal-write-execution-packet",
    label: "正式写回执行包",
    pathKey: "formalWriteExecutionPacketPath",
    summary: "正式写回执行包已生成，含行级差异审计。",
  },
  {
    artifactId: "post-execution-acceptance",
    label: "写回后验收包",
    pathKey: "postExecutionAcceptancePath",
    summary: "正式写回后验收包已生成，用于记录写回后复核状态。",
  },
];

function normalizeArtifactPaths(artifactPaths = {}) {
  return REQUIRED_ARTIFACTS.reduce((result, item) => {
    result[item.pathKey] = artifactPaths[item.pathKey] || "";
    return result;
  }, {});
}

function buildArtifacts(artifactPaths = {}) {
  const paths = normalizeArtifactPaths(artifactPaths);

  return REQUIRED_ARTIFACTS.map((item) => ({
    artifactId: item.artifactId,
    label: item.label,
    status: paths[item.pathKey] ? "present" : "missing",
    path: paths[item.pathKey],
    summary: item.summary,
  }));
}

function buildGoalCompletionAudit({
  artifacts = [],
  formalWriteReadiness = null,
  postExecutionAcceptance = null,
} = {}) {
  const artifactStatus = new Map(
    artifacts.map((item) => [item.artifactId, item.status]),
  );
  const acceptancePassed = postExecutionAcceptance?.status ===
    "formal-write-post-execution-acceptance-passed";
  const readinessReady = formalWriteReadiness?.status === "ready-to-formal-write";
  const items = [
    {
      itemId: "learn-ai-project-materials",
      label: "套用 AI 项目资料模板",
      status: "completed",
      evidence: "已按 Requirement Spec、PRD Writer 和 PI Engine 维护模式推进。",
    },
    {
      itemId: "select-own-project",
      label: "选定当前项目复刻",
      status: "completed",
      evidence: "当前项目为 AI 封面创意助手，未新建无关项目。",
    },
    {
      itemId: "requirement-spec",
      label: "生成 Requirement Spec",
      status: artifactStatus.get("requirement-spec") === "present" ? "completed" : "missing",
      evidence: "AI封面创意助手重做_Requirement_Spec_v0.1.md",
    },
    {
      itemId: "prd-information-architecture",
      label: "进入 PRD 信息架构确认",
      status: artifactStatus.get("prd-information-architecture") === "present"
        ? "completed"
        : "missing",
      evidence: "AI封面创意助手_MVP重做_PRD_信息架构确认_v0.1.md",
    },
    {
      itemId: "architecture-plan",
      label: "生成产品线重做架构计划",
      status: artifactStatus.get("architecture-plan") === "present" ? "completed" : "missing",
      evidence: "AI封面创意助手产品线重做架构计划_v0.1.md",
    },
    {
      itemId: "pi-engine-maintenance-loop",
      label: "进入 PI Engine 维护模式闭环",
      status: readinessReady ? "completed" : "in-progress",
      evidence: formalWriteReadiness?.status || "待刷新写回门禁",
    },
    {
      itemId: "formal-write",
      label: "执行正式写回",
      status: acceptancePassed ? "completed" : "waiting-for-confirmation",
      evidence: acceptancePassed
        ? "正式写回后验收通过"
        : "等待确认短语：确认执行正式写回",
    },
    {
      itemId: "post-execution-acceptance",
      label: "完成写回后验收",
      status: acceptancePassed ? "completed" : "pending",
      evidence: `${postExecutionAcceptance?.passedCount ?? 0} / ${
        postExecutionAcceptance?.totalCount ?? 0
      }`,
    },
  ];
  const completedCount = items.filter((item) => item.status === "completed").length;
  const totalCount = items.length;

  return {
    status: completedCount === totalCount
      ? "complete"
      : "waiting-for-formal-write-confirmation",
    completedCount,
    totalCount,
    items,
    remainingRequiredAction: completedCount === totalCount
      ? {
          label: "目标已完成",
          summary: "AI 项目资料复刻流程已完成正式写回与验收。",
        }
      : {
          label: "等待正式写回确认",
          requiredPhrase: "确认执行正式写回",
          summary: "只有收到确认短语后，才能执行正式写回并完成最后验收。",
        },
  };
}

export function buildPiEngineExecutionPositionAudit({
  artifactPaths = {},
  formalWriteReadiness = null,
  formalWriteExecutionPacket = null,
  postExecutionAcceptance = null,
} = {}) {
  const artifacts = buildArtifacts(artifactPaths);
  const presentCount = artifacts.filter((item) => item.status === "present").length;
  const readinessReady = formalWriteReadiness?.status === "ready-to-formal-write";
  const acceptancePassed = postExecutionAcceptance?.status ===
    "formal-write-post-execution-acceptance-passed";
  const currentStage = acceptancePassed
    ? "post-formal-write-follow-up"
    : readinessReady
      ? "formal-write-waiting-for-confirmation"
      : "pi-engine-maintenance-audit";
  const goalCompletion = buildGoalCompletionAudit({
    artifacts,
    formalWriteReadiness,
    postExecutionAcceptance,
  });
  const nextAction = acceptancePassed
    ? {
        actionId: "review-formal-write-follow-up",
        label: "复核写回后承接任务",
        summary: "继续检查规则修订任务单与关键样例复跑是否进入下一轮处理。",
      }
    : readinessReady
      ? {
          actionId: "export-manual-review-formal-write",
          label: "执行正式写回",
          requiredPhrase:
            formalWriteExecutionPacket?.confirmation?.requiredPhrase || "确认执行正式写回",
          summary: "当前不需要重跑需求或 PRD，下一步只等待人工确认正式写回。",
        }
      : {
          actionId: "refresh-formal-write-gate",
          label: "刷新写回门禁",
          summary: "读取最新安全预览、执行包和验收包，确认缺失证据。",
        };

  return {
    ok: presentCount === artifacts.length && Boolean(formalWriteReadiness),
    status: currentStage,
    summary: acceptancePassed
      ? "AI 项目资料流程已完成正式写回与验收，当前进入写回后承接任务复核。"
      : readinessReady
        ? "AI 项目资料流程已进入 PI Engine 维护模式，当前位点是正式写回确认门禁。"
        : "AI 项目资料流程已进入 PI Engine 维护模式，当前需要先刷新写回门禁证据。",
    mode: {
      piEngineMode: "maintenance",
      terminalType: "PC",
      implementationBoundary: "复用当前 Web 应用，不新建 Web v2，不切换技术栈。",
    },
    artifacts,
    artifactProgress: {
      presentCount,
      totalCount: artifacts.length,
    },
    formalWriteGate: {
      readinessStatus: formalWriteReadiness?.status || "unknown",
      readinessSummary: formalWriteReadiness?.summary || "",
      executionPacketStatus: formalWriteExecutionPacket?.status || "unknown",
      lineDiffHunkCount: formalWriteExecutionPacket?.lineDiff?.hunkCount ?? null,
      postExecutionAcceptanceStatus: postExecutionAcceptance?.status || "unknown",
      postExecutionAcceptanceProgress: `${postExecutionAcceptance?.passedCount ?? 0} / ${
        postExecutionAcceptance?.totalCount ?? 0
      }`,
    },
    completedStages: [
      "Requirement Spec 已生成",
      "PRD 信息架构已确认",
      "产品线重做架构计划已生成",
      "安全预览确认块已写入",
      "正式写回执行包已生成",
      "正式写回后验收包已生成",
    ],
    blockedRepeats: [
      "不重新生成 Requirement Spec",
      "不重新生成 PRD 信息架构",
      "不重复写入安全预览确认块",
      "不绕过正式写回确认短语",
    ],
    goalCompletion,
    nextAction,
    safetyBoundary: "该审计包只读取项目状态并生成项目内证据，不写入 Obsidian，不执行正式写回。",
  };
}

export function buildPiEngineExecutionPositionAuditMarkdown(audit) {
  const lines = [
    "# PI Engine 执行位点审计",
    "",
    `- 状态码：${audit.status}`,
    `- 摘要：${audit.summary}`,
    `- 执行模式：${audit.mode.piEngineMode}`,
    `- 实现边界：${audit.mode.implementationBoundary}`,
    `- 资料进度：${audit.artifactProgress.presentCount} / ${audit.artifactProgress.totalCount}`,
    `- 写回门禁：${audit.formalWriteGate.readinessStatus}`,
    `- 执行包状态：${audit.formalWriteGate.executionPacketStatus}`,
    `- 验收包状态：${audit.formalWriteGate.postExecutionAcceptanceStatus}`,
    `- 验收进度：${audit.formalWriteGate.postExecutionAcceptanceProgress}`,
    `- 目标完成度：${audit.goalCompletion.completedCount} / ${audit.goalCompletion.totalCount}`,
    `- 目标状态：${audit.goalCompletion.status}`,
    `- 安全边界：${audit.safetyBoundary}`,
    "",
    "## 1. 已确认资料",
    "",
  ];

  audit.artifacts.forEach((item) => {
    lines.push(`- ${item.label}：[${item.status}] ${item.summary}`);
    lines.push(`  - 路径：${item.path || "待补齐"}`);
  });

  lines.push("", "## 2. 不重复执行", "");
  audit.blockedRepeats.forEach((item) => {
    lines.push(`- ${item}`);
  });

  lines.push(
    "",
    "## 3. 目标完成度",
    "",
  );

  audit.goalCompletion.items.forEach((item) => {
    lines.push(`- ${item.label}：[${item.status}] ${item.evidence}`);
  });

  lines.push(
    "",
    "## 4. 下一步",
    "",
    `- 推荐动作：${audit.nextAction.label}`,
    `- 动作说明：${audit.nextAction.summary}`,
  );

  if (audit.nextAction.requiredPhrase) {
    lines.push(`- 动作短语：${audit.nextAction.requiredPhrase}`);
  }

  return lines.join("\n");
}
