export function buildRealCaseReadinessReport(items) {
  const rows = [...items].sort((left, right) => left.caseId.localeCompare(right.caseId));

  return {
    summary: {
      totalRealCases: rows.length,
      readyCount: rows.filter((row) => row.status === "可进入手动验证").length,
      partialCount: rows.filter((row) => row.status === "部分回填").length,
      pendingCount: rows.filter((row) => row.status === "待回填").length,
    },
    rows,
  };
}
