export function buildRealCaseOverviewMeta({
  keyCaseRerunPriority = 0,
  readinessStatus = "待回填",
  latestExportStatus = null,
}) {
  const exportActionLabel = latestExportStatus?.actionLabel || "尚未导出";
  const exportMode = latestExportStatus?.requestedMode || "none";
  const readbackOk = latestExportStatus?.readbackOk === true;

  let laneLabel = "待进入维护";
  let laneOrder = 1;

  if (!latestExportStatus) {
    laneLabel = "优先补写并导出";
    laneOrder = 0;
  } else if (!readbackOk) {
    laneLabel = "导出待确认";
    laneOrder = 1;
  } else if (readinessStatus === "可进入手动验证") {
    laneLabel = "已可进入验证";
    laneOrder = 3;
  } else if (exportMode === "copy") {
    laneLabel = "已导出副本待收敛";
    laneOrder = 2;
  } else {
    laneLabel = "已导出待继续补写";
    laneOrder = 2;
  }

  let readinessWeight = 3;
  if (readinessStatus === "待回填") {
    readinessWeight = 0;
  } else if (readinessStatus === "部分回填") {
    readinessWeight = 1;
  } else if (readinessStatus === "可进入手动验证") {
    readinessWeight = 2;
  }

  const exportPenalty = !latestExportStatus ? 0 : readbackOk ? 2 : 1;
  const priorityScore = laneOrder * 100 + readinessWeight * 10 - Number(keyCaseRerunPriority || 0) - exportPenalty;

  return {
    laneLabel,
    laneOrder,
    exportActionLabel,
    exportMode,
    readbackOk,
    isActionable:
      laneLabel === "优先补写并导出" ||
      laneLabel === "导出待确认" ||
      laneLabel === "已导出待继续补写" ||
      laneLabel === "已导出副本待收敛",
    priorityScore,
  };
}
