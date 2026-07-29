function optimizeCurrentSchema() {
  return [
    {
      fieldId: "keep_subject",
      label: "想保留的主体",
      inputType: "text",
      placeholder: "例如：人物表情、手势、产品主体、截图里的关键区域",
    },
    {
      fieldId: "remove_noise",
      label: "想弱化或裁掉的部分",
      inputType: "textarea",
      placeholder: "例如：背景太杂、字幕太多、边角信息太分散注意力",
    },
    {
      fieldId: "current_problem",
      label: "当前图最不满意的地方",
      inputType: "textarea",
      placeholder: "例如：太平、不聚焦、不够像热门封面",
    },
  ];
}

function searchMatchedSchema() {
  return [
    {
      fieldId: "desired_subject",
      label: "最适合补什么主体/场景",
      inputType: "text",
      placeholder: "例如：疲惫的人、待办清单、时间被占满的桌面场景",
    },
    {
      fieldId: "avoid_style",
      label: "需要避免的图像风格",
      inputType: "textarea",
      placeholder: "例如：太廉价、太鸡汤、太营销号、太像素材库海报",
    },
    {
      fieldId: "strengthen_click_point",
      label: "补图后最想强化的点击点",
      inputType: "textarea",
      placeholder: "例如：让人更想知道为什么忙却没结果",
    },
  ];
}

function conceptFirstSchema() {
  return [
    {
      fieldId: "first_glance_subject",
      label: "第一眼最想让用户看到的主体",
      inputType: "text",
      placeholder: "例如：被时间追着跑的人、写满叉号的计划表、夸张的忙碌动作",
    },
    {
      fieldId: "emotion_or_conflict",
      label: "主体要传达的情绪或冲突",
      inputType: "textarea",
      placeholder: "例如：越忙越没结果、表面努力和真实低效之间的反差",
    },
    {
      fieldId: "avoid_cheapness",
      label: "最想避免的廉价感",
      inputType: "textarea",
      placeholder: "例如：太标题党、太油腻、太像拼贴营销图",
    },
  ];
}

export function buildActionWorkspaceInputSchema(workspaceId) {
  if (workspaceId === "optimize-current") {
    return optimizeCurrentSchema();
  }

  if (workspaceId === "search-matched") {
    return searchMatchedSchema();
  }

  return conceptFirstSchema();
}
