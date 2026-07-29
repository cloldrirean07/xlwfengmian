import { runFormalWriteFollowUpPlanStatus } from "../src/application/runFormalWriteFollowUpPlanStatus.js";

const plan = await runFormalWriteFollowUpPlanStatus();

console.log(
  JSON.stringify(
    {
      ok: plan.ok,
      status: plan.status,
      ruleRevision: plan.sections.ruleRevision.label,
      keyCaseRerun: plan.sections.keyCaseRerun.label,
      commandCount: plan.commandChain.length,
      outputs: plan.outputPaths,
      summary: plan.summary,
    },
    null,
    2,
  ),
);
