export const titleStyleLibrary = [
  {
    styleId: "lifestyle-snapshot-cover-task",
    styleLabel: "随手拍封面任务",
    requiredAny: ["随手拍", "生活方式", "生活碎片", "日常", "四宫格", "拼图"],
    templates: [
      {
        requiredAny: ["随手拍", "生活方式", "生活碎片"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "普通随手拍也能做成封面",
      },
      {
        requiredAny: ["四宫格", "拼图", "生活碎片"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "生活拼图要先给一个主题",
      },
    ],
  },
  {
    styleId: "lifestyle-light-hook",
    styleLabel: "生活方式轻钩子",
    requiredAny: ["松弛感", "城市散步", "咖啡", "窗景", "健身房", "街景", "自然光"],
    templates: [
      {
        requiredAny: ["松弛感", "自然光", "低饱和", "胶片感"],
        title: "松弛感照片别只写随手拍",
      },
      {
        requiredAny: ["城市散步", "咖啡", "窗景", "健身房", "街景"],
        title: "这类生活图适合这样配标题",
      },
    ],
  },
  {
    styleId: "talking-head-pain-result",
    styleLabel: "口播痛点结果",
    requiredAny: ["口播", "镜头表现力", "自媒体", "不露脸", "人物"],
    templates: [
      {
        requiredAny: ["口播", "镜头表现力", "自媒体"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "口播不自然，先改这张封面",
      },
      {
        requiredAny: ["不露脸", "口播"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "不露脸口播，也能做清楚封面",
      },
    ],
  },
  {
    styleId: "talking-head-newbie-flow",
    styleLabel: "口播新手流程",
    requiredAny: ["口播", "新手", "训练", "标准流程", "剪辑"],
    templates: [
      {
        requiredAny: ["口播", "新手", "训练"],
        title: "新手口播训练，先看这一版",
      },
      {
        requiredAny: ["口播", "标准流程", "剪辑"],
        title: "口播封面标准流程",
      },
    ],
  },
  {
    styleId: "food-impact-cover-task",
    styleLabel: "食欲冲击封面",
    requiredAny: ["辣炒鱿鱼", "鱿鱼", "香辣蟹", "螃蟹", "海鲜", "红油"],
    templates: [
      {
        requiredAny: ["辣炒鱿鱼", "鱿鱼", "海鲜"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "辣炒海鲜封面，先抓住这一口",
      },
      {
        requiredAny: ["红油", "螃蟹", "香辣蟹", "海鲜"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "红油和海鲜，是这张封面的点击点",
      },
    ],
  },
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
    styleId: "sunset-cover-task",
    styleLabel: "晚霞封面任务",
    requiredAny: ["夏日晚霞", "晚霞", "霞光", "天空", "云层", "落日"],
    templates: [
      {
        requiredAny: ["霞光", "夏日晚霞", "晚霞", "落日"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "最后一抹霞光，适合这样做封面",
      },
      {
        requiredAny: ["天空", "云层", "晚霞", "落日"],
        requiredTextAny: ["AI", "封面", "教程"],
        title: "一张天空图也能做出封面感",
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
