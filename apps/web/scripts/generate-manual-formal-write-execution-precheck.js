import { runManualFormalWriteExecutionPrecheckStatus } from "../src/application/runManualFormalWriteExecutionPrecheckStatus.js";

async function main() {
  const precheck = await runManualFormalWriteExecutionPrecheckStatus();

  console.log(
    JSON.stringify(
      {
        ok: precheck.ok,
        status: precheck.status,
        targetBatchLabel: precheck.target.batchLabel,
        readinessStatus: precheck.readiness.status,
        targetRecordPath: precheck.target.targetRecordPath,
        outputs: {
          json: precheck.sourcePaths?.json,
          markdown: precheck.sourcePaths?.markdown,
        },
        summary: precheck.summary,
      },
      null,
      2,
    ),
  );

  if (!precheck.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
