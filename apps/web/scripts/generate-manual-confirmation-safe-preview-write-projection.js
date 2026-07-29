import { runManualConfirmationSafePreviewWriteProjectionStatus } from "../src/application/runManualConfirmationSafePreviewWriteProjectionStatus.js";

try {
  const projection = await runManualConfirmationSafePreviewWriteProjectionStatus();

  console.log(
    JSON.stringify(
      {
        ok: projection.ok,
        status: projection.status,
        projectedReadinessStatus: projection.projectedReadiness.status,
        targetBatchLabel: projection.writePrecheck.targetBatchLabel,
        nextAction: projection.nextAction.label,
        outputs: {
          json: projection.sourcePaths.json,
          markdown: projection.sourcePaths.markdown,
        },
        summary: projection.summary,
      },
      null,
      2,
    ),
  );

  if (!projection.ok) {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
