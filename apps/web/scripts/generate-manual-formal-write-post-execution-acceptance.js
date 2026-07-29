import { runManualFormalWritePostExecutionAcceptanceStatus } from "../src/application/runManualFormalWritePostExecutionAcceptanceStatus.js";

const result = await runManualFormalWritePostExecutionAcceptanceStatus();

console.log(
  JSON.stringify(
    {
      ok: result.ok,
      status: result.status,
      targetBatchLabel: result.target.batchLabel,
      acceptanceProgress: `${result.passedCount}/${result.totalCount}`,
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
