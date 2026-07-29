export function buildObsidianPlatformSyncLogRecord({
  generatedAt,
  sourceMarkdownPath,
  syncLogMarkdown,
}) {
  return [
    `# 平台案例同步记录_${generatedAt}`,
    "",
    "> 生成方式：代码侧 `sync:platform-note` 自动生成同步记录",
    `> 生成时间：${generatedAt}`,
    `> 对应代码底稿：${sourceMarkdownPath}`,
    "> 文档状态：可继续编辑",
    "",
    "## 0. 使用说明",
    "- 这是一份平台案例笔记同步到 real-case 后的自动记录。",
    "- 下面的“代码侧同步底稿”记录了字段变化和 readiness 变化。",
    "- 你后续可以在这里补充这次同步是否可信、是否还需要人工修正。",
    "",
    "## 1. 代码侧同步底稿",
    "",
    syncLogMarkdown.trim(),
    "",
    "## 2. 人工补充",
    "- 这次同步是否符合预期：",
    "- 哪个字段还需要手工确认：",
    "- 是否需要继续跑 write + refresh：",
    "",
  ].join("\n");
}
