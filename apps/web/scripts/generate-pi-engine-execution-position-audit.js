import { runPiEngineExecutionPositionAuditStatus } from "../src/application/runPiEngineExecutionPositionAuditStatus.js";

const audit = await runPiEngineExecutionPositionAuditStatus();

console.log(
  JSON.stringify(
    {
      ok: audit.ok,
      status: audit.status,
      artifactProgress: `${audit.artifactProgress.presentCount}/${audit.artifactProgress.totalCount}`,
      goalCompletion: `${audit.goalCompletion.completedCount}/${audit.goalCompletion.totalCount}`,
      goalStatus: audit.goalCompletion.status,
      nextAction: audit.nextAction.label,
      requiredPhrase: audit.nextAction.requiredPhrase || "",
      outputs: audit.outputPaths,
      summary: audit.summary,
    },
    null,
    2,
  ),
);
