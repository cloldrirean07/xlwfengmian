# 批次复盘看板导出到Obsidian_v0.1

## 1. 本次补的是什么

让“批次复盘看板”具备和其他正式报告一致的导出能力：

- 代码侧 Markdown 底稿
- Obsidian 草稿预览
- 正式导出
- 导出日志
- 读回确认

这意味着它不再只是页面上的即时面板，而是可以沉淀成持续项目记录的一部分。

## 2. 为什么这一步重要

如果复盘看板只能在页面里看，而不能进入 Obsidian，就会出现两个问题：

1. 项目推进记录断层
2. 后续人工补充无法接在同一份文档上继续累积

而你的目标一直是：

- 内容要可修改
- 有规划
- 有后续留白
- 持续进入 Obsidian 项目仓库

所以这一步是把“可看”升级成“可沉淀”。

## 3. 当前实现方式

新增：

- `apps/web/src/domain/review/buildObsidianBatchReviewDashboardRecord.js`
- `apps/web/src/application/createBatchReviewDashboardObsidianPreview.js`
- `apps/web/src/application/exportBatchReviewDashboardToObsidian.js`

并补充：

- 服务端导出接口
- 前端导出按钮
- 导出日志记录

## 4. 当前导出产物结构

当前会生成：

1. 代码侧 JSON
   - `outputs/batch-review-dashboard/batch-review-dashboard.json`

2. 代码侧 Markdown
   - `outputs/batch-review-dashboard/batch-review-dashboard.md`

3. Obsidian 草稿
   - `05_验证与实验/批次试跑记录/批次复盘看板/批次复盘看板_YYYY-MM-DD.md`

4. 导出日志
   - `outputs/obsidian-export-logs/batch-review-dashboard/*.json`

## 5. 当前 Obsidian 草稿结构

草稿中包含：

- 使用说明
- 代码侧看板底稿
- 人工补充

这样后续你可以直接在 Obsidian 里继续补：

- 当前最该先补的批次
- 这一批补完后最想验证的点
- 是否开始进入 UI 交互层优化讨论

## 6. 当前前端接入位置

前端新增：

- `生成复盘看板`
- `导出复盘看板`

所以这块现在形成完整链路：

- 先预览
- 再导出
- 再在 Obsidian 中继续编辑

## 7. 当前价值

这一步完成后，复盘看板正式进入你的长期项目资产，而不只是一次性判断工具。

这很关键，因为后续 UI 讨论最需要的不是单次判断，而是：

- 连续的阶段判断
- 可追踪的推进记录
- 可反复回看的人工结论

## 8. 下一步建议

下一步最有价值的是：

1. 真正导出一份复盘看板到你的 Obsidian
2. 按看板提示补当前最该补的那一批
3. 再回看这份 Obsidian 看板，补一句“这一批补完后最想验证的点”
4. 让 UI 讨论前的人工判断开始沉淀成连续记录
