import { runManualConfirmationSafePreviewWritePrecheckStatus } from "../src/application/runManualConfirmationSafePreviewWritePrecheckStatus.js";

async function main() {
  const precheck = await runManualConfirmationSafePreviewWritePrecheckStatus();

  console.log(
    JSON.stringify(
      {
        ok: precheck.ok,
        status: precheck.status,
        targetBatchLabel: precheck.targetBatchLabel,
        changedFieldCount: precheck.changedFieldCount,
        canProceedToFormalWriteAfterApply: precheck.after?.canProceedToFormalWrite,
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
