function getTimestampValue(value) {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function buildFollowUpProgressSummary(checklist = {}, progress = {}) {
  const actionableEntries = [];
  const phaseSummaries = [];
  let activePhaseAssigned = false;

  for (const phase of checklist.phases || []) {
    const phaseEntries = [];

    for (const item of phase.items || []) {
      if (!item?.actionId) {
        continue;
      }

      const entry = {
        phaseLabel: phase.label,
        item,
        status: progress[item.actionId] || null,
      };

      actionableEntries.push(entry);
      phaseEntries.push(entry);
    }

    if (phaseEntries.length) {
      const completedCount = phaseEntries.filter(
        (entry) => entry.status?.state === "completed",
      ).length;
      let status = "pending";

      if (completedCount >= phaseEntries.length) {
        status = "completed";
      } else if (!activePhaseAssigned) {
        status = "active";
        activePhaseAssigned = true;
      }

      phaseSummaries.push({
        phaseLabel: phase.label,
        totalCount: phaseEntries.length,
        completedCount,
        status,
      });
    }
  }

  const completedEntries = actionableEntries.filter((entry) => entry.status?.state === "completed");
  const runningEntries = actionableEntries.filter((entry) => entry.status?.state === "running");
  const nextEntry =
    actionableEntries.find((entry) => entry.status?.state !== "completed") || null;
  const mostRecentCompleted =
    completedEntries
      .slice()
      .sort(
        (left, right) =>
          getTimestampValue(right.status?.updatedAt) - getTimestampValue(left.status?.updatedAt),
      )[0] || null;
  const completedPhaseCount = phaseSummaries.filter(
    (phase) => phase.completedCount >= phase.totalCount,
  ).length;
  const nextPhaseLabel = nextEntry?.phaseLabel || "";
  const recentCompletedEntries = completedEntries
    .slice()
    .sort(
      (left, right) =>
        getTimestampValue(right.status?.updatedAt) - getTimestampValue(left.status?.updatedAt),
    )
    .slice(0, 5);
  const transitionSummary =
    mostRecentCompleted && nextEntry
      ? `刚完成「${mostRecentCompleted.item.label}」，当前切到「${nextEntry.phaseLabel}」`
      : mostRecentCompleted
        ? `刚完成「${mostRecentCompleted.item.label}」`
        : nextEntry
          ? `当前先做「${nextEntry.phaseLabel}」`
          : "";
  const upcomingSummary =
    nextEntry && nextPhaseLabel
      ? `完成这一步后，将继续推进「${nextPhaseLabel}」阶段。`
      : "";

  return {
    totalActionableCount: actionableEntries.length,
    completedCount: completedEntries.length,
    runningCount: runningEntries.length,
    remainingCount: actionableEntries.length - completedEntries.length,
    completedPhaseCount,
    totalPhaseCount: phaseSummaries.length,
    nextPhaseLabel,
    transitionSummary,
    upcomingSummary,
    phaseSummaries,
    recentCompletedEntries,
    nextEntry,
    mostRecentCompleted,
  };
}
