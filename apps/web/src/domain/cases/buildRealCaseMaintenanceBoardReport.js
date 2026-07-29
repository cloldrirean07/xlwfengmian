function buildPriorityBand(priority) {
  if (priority >= 8) {
    return "P1";
  }
  if (priority >= 4) {
    return "P2";
  }
  if (priority > 0) {
    return "P3";
  }
  return "Backlog";
}

function buildActionRecommendation(row) {
  if (row.priorityBand === "P1" && row.readinessStatus !== "可进入手动验证") {
    return "优先补齐关键缺失字段，再进入验证";
  }
  if (row.priorityBand === "P1") {
    return "优先进入手动验证与复跑";
  }
  if (row.priorityBand === "P2" && row.readinessStatus === "待回填") {
    return "先完成基础字段回填";
  }
  if (row.priorityBand === "P2") {
    return "可作为下一批重点维护案例";
  }
  if (row.priorityBand === "P3") {
    return "保留在维护池，按空档推进";
  }
  return "先不进入关键维护链";
}

function buildReasonNotes(operations, readiness) {
  const notes = [];

  if ((operations?.keyCaseRerunPriority || 0) >= 8) {
    notes.push("关键复跑优先级高");
  } else if ((operations?.keyCaseRerunPriority || 0) > 0) {
    notes.push("已进入关键复跑池");
  } else {
    notes.push("当前未进入关键复跑池");
  }

  if ((operations?.maintenanceTags || []).includes("misclassified-seed")) {
    notes.push("属于误判种子样例");
  }
  if ((operations?.maintenanceTags || []).includes("high-priority-candidate")) {
    notes.push("已标为高优先候选");
  }
  if ((operations?.maintenanceTags || []).includes("platform-bridge")) {
    notes.push("承担平台案例到代码层桥接作用");
  }

  if (readiness.status === "待回填") {
    notes.push("当前字段缺失较多");
  } else if (readiness.status === "部分回填") {
    notes.push("已有基础信息，但仍未达验证条件");
  } else if (readiness.status === "可进入手动验证") {
    notes.push("字段已具备手动验证条件");
  }

  return notes;
}

export function buildRealCaseMaintenanceBoardReport(realCases, readinessRows) {
  const readinessMap = new Map((readinessRows || []).map((row) => [row.caseId, row]));
  const rows = [...(realCases || [])]
    .map((item) => {
      const readiness = readinessMap.get(item.id) || {
        status: "待回填",
        completedChecks: 0,
        totalChecks: 0,
        missingFields: [],
      };
      const rerunPriority = item.operations?.keyCaseRerunPriority || 0;
      const priorityBand = buildPriorityBand(rerunPriority);

      return {
        caseId: item.id,
        title: item.title,
        platform: item.platform,
        platformCaseId: item.tracking?.platformCaseId || "",
        rerunPriority,
        priorityBand,
        maintenanceTags: item.operations?.maintenanceTags || [],
        readinessStatus: readiness.status,
        completedChecks: readiness.completedChecks,
        totalChecks: readiness.totalChecks,
        missingFields: readiness.missingFields || [],
        reasonNotes: buildReasonNotes(item.operations, readiness),
        actionRecommendation: buildActionRecommendation({
          priorityBand,
          readinessStatus: readiness.status,
        }),
      };
    })
    .sort((left, right) => {
      const bandWeight = { P1: 4, P2: 3, P3: 2, Backlog: 1 };
      return (
        bandWeight[right.priorityBand] - bandWeight[left.priorityBand] ||
        right.rerunPriority - left.rerunPriority ||
        left.caseId.localeCompare(right.caseId, "zh-CN")
      );
    });

  return {
    summary: {
      totalRealCases: rows.length,
      p1Count: rows.filter((row) => row.priorityBand === "P1").length,
      p2Count: rows.filter((row) => row.priorityBand === "P2").length,
      p3Count: rows.filter((row) => row.priorityBand === "P3").length,
      backlogCount: rows.filter((row) => row.priorityBand === "Backlog").length,
      readyHighPriorityCount: rows.filter(
        (row) => row.priorityBand !== "Backlog" && row.readinessStatus === "可进入手动验证",
      ).length,
    },
    rows,
  };
}
