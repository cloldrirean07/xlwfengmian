import { batchRunManualReviewKeyFields } from "./batchRunManualReviewKeyFields.js";

const keyFieldDefinitions = [
  {
    key: "bottleneckStep",
    label: "这批案例最卡的环节",
    shortLabel: "最卡环节",
    prompt: "这一批真实试跑里，你最容易停住的步骤是哪一步？",
    whyItMatters: "先确认最卡步骤，后面才能判断问题是在输入、结果还是导出接力。",
    answerHint: "尽量写成一个具体动作，例如“看完结果不知道先选哪条”。",
  },
  {
    key: "issueType",
    label: "当前更像功能问题，还是界面问题",
    shortLabel: "问题类型",
    prompt: "如果现在只能先归因一次，你更觉得是能力不够，还是展示组织不顺？",
    whyItMatters: "这项会直接影响是否应该先补规则能力，还是开始进入 UI 调整。",
    answerHint: "先只做一级判断，例如“更像功能问题”或“更像界面问题”。",
  },
  {
    key: "prioritizedModule",
    label: "哪个按钮或模块最该前置",
    shortLabel: "前置模块",
    prompt: "如果只能先把一个模块提前或强调，你会改哪块？",
    whyItMatters: "这项能把抽象的“不顺手”变成具体模块，为后续 UI 讨论收口。",
    answerHint: "优先写模块名，例如“结果区”“输入准备区”“导出后下一步”。",
  },
  {
    key: "uiOptimizationTiming",
    label: "UI 优化是否已经到时机",
    shortLabel: "UI 时机",
    prompt: "基于这批真实试跑，现在讨论 UI 会不会太早？",
    whyItMatters: "这项是是否正式开启 UI 优化专题的直接判断输入。",
    answerHint: "先用阶段性判断，例如“先别急着做 UI”或“接近可以讨论 UI”。",
  },
];

function findCategoryById(frictionTemplate = [], categoryId = "") {
  return frictionTemplate.find((item) => item.id === categoryId) || null;
}

export function buildBatchRunManualReviewGuide({
  frictionTemplate = [],
  validationSummary,
  latestWorksheetHistory,
}) {
  const inputCategory = findCategoryById(frictionTemplate, "input-structure");
  const resultCategory = findCategoryById(frictionTemplate, "result-reading");
  const uiCategory = findCategoryById(frictionTemplate, "ui-decision-readiness");
  const exportCategory = findCategoryById(frictionTemplate, "export-and-handoff");
  const totalMissingFields = Number(validationSummary?.summary?.totalMissingFields || 0);
  const latestExportStatus = latestWorksheetHistory?.latestExportStatus || null;

  return {
    headline: "先补这 4 个关键人工判断",
    reason:
      "这 4 项先补齐，跨批次汇总才更容易判断现在是规则问题、流程问题，还是已经到该做 UI 的时机。",
    completionRule:
      "最低建议先填完最卡环节、问题类型、最该前置模块、UI 时机判断，再补其他开放结论。",
    fillOrder: keyFieldDefinitions.map((item, index) => {
      const sharedField = batchRunManualReviewKeyFields.find((field) => field.key === item.key);
      return {
        ...item,
        labelShort: sharedField?.label || item.shortLabel,
        rank: index + 1,
      };
    }),
    supportingSignals: [
      inputCategory
        ? `输入准备：${inputCategory.priorityReason}`
        : `输入准备：当前这批还有 ${totalMissingFields} 个缺失字段，可先判断是不是输入太重。`,
      resultCategory
        ? `结果阅读：${resultCategory.priorityReason}`
        : "结果阅读：先看用户是否看完结果还能立即决定下一步。",
      uiCategory
        ? `UI 判断：${uiCategory.priorityReason}`
        : "UI 判断：先分清是功能问题还是界面问题，避免过早改视觉。",
      exportCategory
        ? `导出接力：${exportCategory.priorityReason}`
        : `导出接力：${latestExportStatus ? "已有导出记录，建议确认导出后是否愿意继续补写。" : "当前还没有稳定导出记录。"} `,
    ],
    suggestedWorkflow: [
      "先回看输入准备和结果阅读，写出你真实卡住的动作。",
      "再判断它更像功能问题还是界面问题，不要一开始就跳到视觉层。",
      "最后写最该前置的模块和是否到 UI 时机，方便下一轮跨批次汇总直接吸收。",
    ],
  };
}
