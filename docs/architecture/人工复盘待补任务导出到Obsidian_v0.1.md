# 人工复盘待补任务导出到Obsidian_v0.1

## 1. 目标

这一步要解决的问题是：

- 复盘看板已经能告诉你当前该补什么
- 但如果还要手动抄到别的地方再填，执行成本还是偏高

所以这次补的是：

- 把人工复盘待补任务直接导出成 Obsidian 草稿

这样你看到待补任务后，就可以直接生成一份可填写文档。

## 2. 当前接入思路

这次没有新开独立工作台，而是继续沿着现有复盘链路往下接：

1. 批次复盘看板算出 `manualReviewTaskCard`
2. `manualReviewTaskCard` 生成 Markdown 底稿
3. 再导出成 Obsidian 可编辑草稿

这样结构上仍然保持：

- 看板负责判断和聚合
- 导出负责把判断变成可执行材料

## 3. 当前新增产物

代码侧新增一套任务单导出链路：

领域层：

- `buildBatchReviewManualTaskCardMarkdown.js`
- `buildObsidianBatchReviewManualTaskCardRecord.js`

应用层：

- `runBatchReviewManualTaskCardPreview.js`
- `createBatchReviewManualTaskCardObsidianPreview.js`
- `exportBatchReviewManualTaskCardToObsidian.js`

服务端接口：

- `POST /api/batch-review-manual-task-card-preview`
- `POST /api/batch-review-manual-task-card-export`

前端接线：

- `apps/web/public/app/api.js`
- `apps/web/public/app/createApp.js`
- `apps/web/public/app/renderers.js`

## 4. 前端现在会多一个什么入口

当复盘看板里存在待补字段时，任务卡下面会出现一个按钮：

- `导出人工复盘待补任务`

点击后会直接把这批当前最该补的人工复盘字段导出到 Obsidian。

## 5. 导出内容结构

当前草稿会包含：

- 当前状态
- 目标批次
- 当前最强摩擦点
- 当前最该先补的信息
- 待补字段与填写提示
- 人工填写区

它的作用不是替代真实批次试跑记录，而是先让你把这一轮关键判断写顺。

## 6. 默认导出位置

Obsidian 默认目录：

- `05_验证与实验/批次试跑记录/人工复盘待补任务`

这个目录和已有的：

- 批次试跑记录
- 跨批次摩擦点汇总
- 批次复盘看板

放在同一条验证链路里，后续查找会更顺。

## 7. 这对后续 UI 讨论的价值

这一步的价值在于，它把“补人工复盘”从页面动作，推进成了一个真正可以拿去填写的工作材料。

后续推进会更自然地变成：

1. 看复盘看板
2. 导出人工待补任务
3. 补真实判断
4. 重跑 UI readiness 和复盘看板
5. 再决定是否进入首页系统 UI 讨论

## 8. 当前结论

可以把这次接入压缩成一句话：

**人工复盘待补任务现在不只是在页面上可见，也已经能直接导出成 Obsidian 草稿，成为真实执行材料。**
