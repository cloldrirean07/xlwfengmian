import { runManualFormalWriteExecutionPacketStatus } from "../src/application/runManualFormalWriteExecutionPacketStatus.js";

const result = await runManualFormalWriteExecutionPacketStatus();

console.log(
  JSON.stringify(
    {
      ok: result.ok,
      status: result.status,
      targetBatchLabel: result.target.batchLabel,
      targetRecordPath: result.target.targetRecordPath,
      outputs: {
        json: result.outputPaths.json,
        markdown: result.outputPaths.markdown,
      },
      summary: result.summary,
    },
    null,
    2,
  ),
);
