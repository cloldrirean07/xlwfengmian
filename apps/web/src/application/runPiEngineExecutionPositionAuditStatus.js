import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildPiEngineExecutionPositionAudit,
  buildPiEngineExecutionPositionAuditMarkdown,
} from "../domain/review/buildPiEngineExecutionPositionAudit.js";
import { runBatchReviewManualFormalWriteReadinessPreview } from "./runBatchReviewManualFormalWriteReadinessPreview.js";
import { runManualFormalWriteExecutionPacketStatus } from "./runManualFormalWriteExecutionPacketStatus.js";
import { runManualFormalWritePostExecutionAcceptanceStatus } from "./runManualFormalWritePostExecutionAcceptanceStatus.js";

const __filename = fileURLToPath(import.meta.url);
const appRoot = join(dirname(__filename), "..", "..");
const projectRoot = join(appRoot, "..", "..");
const outputDir = join(
  appRoot,
  "outputs",
  "pi-engine-execution-position-audit",
);
const jsonPath = join(outputDir, "pi-engine-execution-position-audit.json");
const markdownPath = join(outputDir, "pi-engine-execution-position-audit.md");

const expectedArtifactPaths = {
  requirementSpecPath: join(
    projectRoot,
    "docs",
    "prd",
    "AI封面创意助手重做_Requirement_Spec_v0.1.md",
  ),
  prdInformationArchitecturePath: join(
    projectRoot,
    "docs",
    "prd",
    "AI封面创意助手_MVP重做_PRD_信息架构确认_v0.1.md",
  ),
  architecturePlanPath: join(
    projectRoot,
    "docs",
    "architecture",
    "AI封面创意助手产品线重做架构计划_v0.1.md",
  ),
  safePreviewConfirmationRecordPath: join(
    projectRoot,
    "docs",
    "operations",
    "2026-07-29_安全预览确认块写入执行记录.md",
  ),
  formalWriteExecutionPacketPath: join(
    appRoot,
    "outputs",
    "batch-review-manual-formal-write",
    "manual-formal-write-execution-packet",
    "manual-formal-write-execution-packet.md",
  ),
  postExecutionAcceptancePath: join(
    appRoot,
    "outputs",
    "batch-review-manual-formal-write",
    "manual-formal-write-post-execution-acceptance",
    "manual-formal-write-post-execution-acceptance.md",
  ),
};

async function existingPath(path) {
  try {
    await access(path);
    return path;
  } catch {
    return "";
  }
}

async function resolveArtifactPaths() {
  const entries = await Promise.all(
    Object.entries(expectedArtifactPaths).map(async ([key, path]) => [
      key,
      await existingPath(path),
    ]),
  );

  return Object.fromEntries(entries);
}

export async function runPiEngineExecutionPositionAuditStatus() {
  const [
    artifactPaths,
    formalWriteReadiness,
    formalWriteExecutionPacket,
    postExecutionAcceptance,
  ] = await Promise.all([
    resolveArtifactPaths(),
    runBatchReviewManualFormalWriteReadinessPreview().catch(() => null),
    runManualFormalWriteExecutionPacketStatus().catch(() => null),
    runManualFormalWritePostExecutionAcceptanceStatus().catch(() => null),
  ]);
  const audit = buildPiEngineExecutionPositionAudit({
    artifactPaths,
    formalWriteReadiness,
    formalWriteExecutionPacket,
    postExecutionAcceptance,
  });
  const markdown = buildPiEngineExecutionPositionAuditMarkdown(audit);

  await mkdir(outputDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf-8");
  await writeFile(markdownPath, `${markdown}\n`, "utf-8");

  return {
    ...audit,
    outputPaths: {
      json: jsonPath,
      markdown: markdownPath,
    },
  };
}
