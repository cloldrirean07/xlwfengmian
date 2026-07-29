import { buildManualConfirmationDecisionAdoptionPreview } from "./buildManualConfirmationDecisionAdoptionPreview.js";

const replacements = [
  {
    label: "决策状态",
    from: "- 决策状态：pending",
    to: "- 决策状态：adopt-recommended",
  },
  {
    label: "决策说明",
    from: "- 决策说明：待确认",
    to: "- 决策说明：采用推荐确认块",
  },
];

function includesAllReplacementSources(decisionMarkdown = "") {
  return replacements.every((replacement) => decisionMarkdown.includes(replacement.from));
}

export function buildManualConfirmationDecisionAdoptionPacket({
  decisionMarkdown = "",
  handoffPacket = null,
  sourcePaths = {},
} = {}) {
  const preview = buildManualConfirmationDecisionAdoptionPreview({
    decisionMarkdown,
    handoffPacket,
  });
  const adoptionAlreadyApplied = preview.currentDecision?.decisionStatus === "adopt-recommended";
  const canUsePacket = Boolean(preview.ok && includesAllReplacementSources(decisionMarkdown));
  const ok = Boolean(canUsePacket || adoptionAlreadyApplied);

  return {
    ok,
    status: canUsePacket ? "adoption-packet-ready" : adoptionAlreadyApplied ? "adoption-packet-applied" : "adoption-packet-blocked",
    summary: canUsePacket
      ? "人工采用操作包已生成，可用于人工更新决策记录。"
      : adoptionAlreadyApplied
        ? "推荐确认块已采用，可继续进入安全预览写入前复查。"
        : "人工采用操作包未就绪，请先修正决策记录或采用预演。",
    safetyBoundary: "仅生成项目内人工操作包，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    sourcePaths,
    replacements,
    currentDecision: preview.currentDecision,
    adoptedDecision: preview.adoptedDecision,
    canProceedToSafePreviewWriteAfterAdoption: preview.canProceedToSafePreviewWriteAfterAdoption,
    nextChecks: [
      "人工确认采用后，按替换项更新项目内决策记录。",
      "重新生成决策校验与采用预演报告。",
      "确认状态进入 ready-for-safe-preview-write 后，再进入安全预览写入前复查。",
    ],
  };
}

export function buildManualConfirmationDecisionAdoptionPacketMarkdown(packet) {
  const statusLabel = packet.status === "adoption-packet-applied" ? "已应用" : packet.ok ? "可使用" : "需修正";
  const lines = [
    "# 人工采用操作包",
    "",
    `- 操作包状态：${statusLabel}`,
    `- 状态码：${packet.status}`,
    `- 摘要：${packet.summary}`,
    `- 安全边界：${packet.safetyBoundary}`,
    "",
    "## 1. 决策记录",
    "",
    `- 当前决策：${packet.currentDecision?.decisionLabel || "暂无"}`,
    `- 采用后决策：${packet.adoptedDecision?.decisionLabel || "暂无"}`,
    `- 采用后是否进入安全预览写入前复查：${packet.canProceedToSafePreviewWriteAfterAdoption ? "是" : "否"}`,
    `- 决策记录文件：${packet.sourcePaths?.decision || "暂无"}`,
    "",
    "## 2. 替换项",
    "",
  ];

  packet.replacements.forEach((replacement) => {
    lines.push(`### ${replacement.label}`);
    lines.push("");
    lines.push("```diff");
    lines.push(`- ${replacement.from}`);
    lines.push(`+ ${replacement.to}`);
    lines.push("```");
    lines.push("");
  });

  lines.push("## 3. 后续复查");
  lines.push("");
  packet.nextChecks.forEach((item) => {
    lines.push(`- ${item}`);
  });

  return lines.join("\n");
}
