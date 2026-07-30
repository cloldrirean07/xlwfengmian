export const titleStyleLibrary = [
  {
    styleId: "night-market-remake",
    styleLabel: "夜市复刻",
    requiredAny: ["辣炒鱿鱼", "鱿鱼", "香辣蟹", "螃蟹"],
    templates: [
      {
        requiredAny: ["辣炒鱿鱼", "鱿鱼"],
        title: "在家复刻夜市香辣鱿鱼",
      },
      {
        requiredAny: ["香辣蟹", "螃蟹"],
        title: "香辣蟹做出饭店味道",
      },
    ],
  },
  {
    styleId: "low-barrier-recipe",
    styleLabel: "低门槛教程",
    requiredAny: ["香辣蟹", "螃蟹", "辣炒鱿鱼", "鱿鱼"],
    templates: [
      {
        requiredAny: ["香辣蟹", "螃蟹"],
        title: "香辣蟹新手零失败",
      },
      {
        requiredAny: ["辣炒鱿鱼", "鱿鱼"],
        title: "香辣鱿鱼一学就会",
      },
    ],
  },
  {
    styleId: "authority-recipe",
    styleLabel: "权威教学",
    requiredAny: ["香辣蟹", "螃蟹", "辣炒鱿鱼", "鱿鱼"],
    templates: [
      {
        requiredAny: ["辣炒鱿鱼", "鱿鱼"],
        title: "厨师长教你做香辣鱿鱼",
      },
      {
        requiredAny: ["香辣蟹", "螃蟹"],
        title: "记住这几步，香辣蟹也能做",
      },
    ],
  },
  {
    styleId: "phone-editing-proof",
    styleLabel: "手机调色证明",
    requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日", "云层"],
    templates: [
      {
        requiredAny: ["火烧云"],
        title: "手机调出火烧云氛围感",
      },
      {
        requiredAny: ["夏日晚霞", "晚霞", "落日", "云层"],
        title: "一键还原落日余晖感",
      },
    ],
  },
  {
    styleId: "ai-scenery-result",
    styleLabel: "AI风景效果",
    requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日", "云层"],
    templates: [
      {
        requiredAny: ["火烧云"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "AI帮摄影小白做出火烧云封面",
      },
      {
        requiredAny: ["夏日晚霞", "晚霞", "落日", "云层"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "AI把晚霞做成封面大片",
      },
    ],
  },
  {
    styleId: "copy-collection",
    styleLabel: "文案合集",
    requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日"],
    templates: [
      {
        requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日"],
        title: "适合晚霞封面的朋友圈文案",
      },
      {
        requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日"],
        title: "把黄昏写进封面",
      },
    ],
  },
  {
    styleId: "comment-area-hook",
    styleLabel: "评论区互动",
    requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日"],
    templates: [
      {
        requiredAny: ["夏日晚霞", "晚霞", "火烧云", "落日"],
        title: "想要一个全是晚霞的评论区",
      },
    ],
  },
];
