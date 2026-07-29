import { runManualConfirmationSafePreviewAdoptionPacketStatus } from "../src/application/runManualConfirmationSafePreviewAdoptionPacketStatus.js";

async function main() {
  const packet = await runManualConfirmationSafePreviewAdoptionPacketStatus();

  console.log(
    JSON.stringify(
      {
        ok: packet.ok,
        status: packet.status,
        targetBatchLabel: packet.targetBatchLabel,
        canProceedToFormalWriteAfterApply: packet.canProceedToFormalWriteAfterApply,
        outputs: {
          json: packet.sourcePaths?.json,
          markdown: packet.sourcePaths?.markdown,
        },
        summary: packet.summary,
      },
      null,
      2,
    ),
  );

  if (!packet.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
