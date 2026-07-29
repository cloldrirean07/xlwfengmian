import { buildManualConfirmationDecisionRejectionPreview } from "./buildManualConfirmationDecisionRejectionPreview.js";

const replacements = [
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

function includesAllReplacementSources(decisionMarkdown = "") {
  return replacements.every((replacement) => decisionMarkdown.includes(replacement.from));
}

export function buildManualConfirmationDecisionRejectionPacket({
  decisionMarkdown = "",
  handoffPacket = null,
  sourcePaths = {},
} = {}) {
  const preview = buildManualConfirmationDecisionRejectionPreview({
    decisionMarkdown,
    handoffPacket,
  });
  const canUsePacket = Boolean(preview.ok && includesAllReplacementSources(decisionMarkdown));

  return {
    ok: canUsePacket,
    status: canUsePacket ? "rejection-packet-ready" : "rejection-packet-blocked",
    summary: canUsePacket
      ? "人工暂不采用操作包已生成，可用于人工更新决策记录。"
      : "人工暂不采用操作包未就绪，请先修正决策记录或暂不采用预演。",
    safetyBoundary: "仅生成项目内人工操作包，不修改决策记录，不写入 Obsidian，不执行正式写回。",
    sourcePaths,
    replacements,
    currentDecision: preview.currentDecision,
    rejectedDecision: preview.rejectedDecision,
    canProceedToSafePreviewWriteAfterRejection: preview.canProceedToSafePreviewWriteAfterRejection,
    nextChecks: [
      "人工确认暂不采用后，按替换项更新项目内决策记录。",
      "重新生成决策校验报告。",
      "确认状态进入 decision-rejected 后，正式写回保持锁定。",
    ],
  };
}

export function buildManualConfirmationDecisionRejectionPacketMarkdown(packet) {
  const lines = [
    "# 人工暂不采用操作包",
    "",
    `- 操作包状态：${packet.ok ? "可使用" : "需修正"}`,
    `- 状态码：${packet.status}`,
    `- 摘要：${packet.summary}`,
    `- 安全边界：${packet.safetyBoundary}`,
    "",
    "## 1. 决策记录",
    "",
    `- 当前决策：${packet.currentDecision?.decisionLabel || "暂无"}`,
    `- 暂不采用后决策：${packet.rejectedDecision?.decisionLabel || "暂无"}`,
    `- 暂不采用后是否进入安全预览写入前复查：${packet.canProceedToSafePreviewWriteAfterRejection ? "是" : "否"}`,
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
