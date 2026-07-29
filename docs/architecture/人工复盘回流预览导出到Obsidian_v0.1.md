# 人工复盘回流预览导出到Obsidian_v0.1

## 1. 目标

前一轮我们已经让系统可以生成：

- 人工复盘回流预览

这次继续往前一步，把这份回流预览导出成 Obsidian 草稿。

这样后面如果要真正写回真实批次试跑结论，就已经有一份更接近最终内容的工作材料。

## 2. 当前接入思路

这次仍然坚持一个原则：

- 先导出回流预览草稿
- 不直接覆盖真实批次试跑记录

原因是：

1. 现在还处在验证回流逻辑阶段
2. 先给一份可审阅的草稿，后续改动风险更低

## 3. 当前新增产物

领域层：

- `buildBatchReviewManualBackfillMarkdown.js`
- `buildObsidianBatchReviewManualBackfillRecord.js`

应用层：

- `runBatchReviewManualBackfillPreview.js`
- `createBatchReviewManualBackfillObsidianPreview.js`
- `exportBatchReviewManualBackfillToObsidian.js`

服务端接口：

- `POST /api/batch-review-manual-backfill-preview`
- `POST /api/batch-review-manual-backfill-export`

前端接线：

- `apps/web/public/app/api.js`
- `apps/web/public/app/createApp.js`
- `apps/web/public/app/renderers.js`

## 4. 当前前端新增入口

当人工待补任务已经有已填写字段时，复盘看板会额外出现：

- `导出人工复盘回流预览`

这个按钮的作用是：

- 把已填写的关键人工判断，整理成更接近真实批次试跑结论的回流草稿

## 5. 当前导出内容包含什么

回流草稿当前会包含：

- 当前状态
- 目标批次
- 已填写字段
- 仍缺字段
- 可回流的批次试跑结论 patch
- 可写回草稿

也就是说，这份草稿已经开始接近“真正写回前的最后确认稿”。

## 6. 默认导出位置

Obsidian 默认目录：

- `05_验证与实验/批次试跑记录/人工复盘回流预览`

它和已有的：

- 人工复盘待补任务
- 批次试跑记录
- 批次复盘看板

共同组成一条更完整的验证链路。

## 7. 对后续 UI 讨论的价值

这一步的价值在于，后续如果你想重跑 `UI readiness`，不再需要先手工把待补任务里的内容重新组织一遍。

顺序会更自然地变成：

1. 填人工待补任务
2. 导出回流预览
3. 确认 patch 是否合理
4. 再决定是否正式写回并重跑 UI readiness

## 8. 当前结论

可以把这次接入压缩成一句话：

**人工复盘填写结果现在已经不只是在任务草稿里停留，而是可以进一步导出成更接近真实批次试跑结论的回流预览草稿。**
