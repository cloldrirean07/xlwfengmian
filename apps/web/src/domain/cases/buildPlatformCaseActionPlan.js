import { getPlatformCaseFieldGuide } from "./platformCaseFieldGuides.js";

function buildTask(label, type, issue = "") {
  const guide = getPlatformCaseFieldGuide(label);
  const fallback = {
    obsidianField: "",
    priority: "P2",
    score: 40,
    reason: "建议补齐后再进入下一步。",
    prompt: "补全该字段，并保持表达具体可判断。",
    example: "",
  };
  const resolved = guide || fallback;

  return {
    label,
    type,
    issue,
    priority: resolved.priority,
    priorityScore: resolved.score - (type === "weak" ? 5 : 0),
    reason: resolved.reason,
    obsidianField: resolved.obsidianField,
    prompt: resolved.prompt,
    example: resolved.example,
  };
}

export function buildPlatformCaseActionPlan({ completeness, quality }) {
  const missingTasks = completeness.missingFields.map((label) => buildTask(label, "missing"));
  const weakTasks = quality.checks
    .filter((item) => item.status === "weak")
    .map((item) => buildTask(item.label, "weak", item.issue));

  const tasks = [...missingTasks, ...weakTasks]
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));

  return {
    totalTasks: tasks.length,
    topPriorityTasks: tasks.filter((item) => item.priority === "P0").slice(0, 3),
    tasks,
  };
}
