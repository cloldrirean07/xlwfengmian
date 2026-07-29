# UI优化进入条件报告生成与导出_v0.1

## 1. 目标

- 给当前产品增加一个正式的 UI 讨论门槛，而不是在案例、试跑和导出证据不足时提前做视觉优化。
- 让系统可以基于已有的批量工作单与批次试跑记录，自动判断当前是否适合进入 UI 优化讨论。
- 让这份判断结果可以继续写入 Obsidian，供后续人工补充真实摩擦点、模块优先级和改版目标。

## 2. 判断逻辑

代码位置：
- `apps/web/src/domain/ui/buildUiOptimizationReadinessReport.js`

当前规则：
- 至少 2 批批量工作单导出
- 至少 2 批批量工作单读回确认
- 至少 2 批真实批次试跑记录
- 至少 1 批试跑记录读回确认
- 跨批次重复摩擦点信号至少达到 `emerging-signal`

状态分层：
- `ready`
  满足导出与读回门槛，且跨批次重复摩擦点已经达到 `strong-signal`，说明已经有足够证据进入 UI 讨论。
- `near-ready`
  满足基础门槛中的 2-3 项，且跨批次信号不是 `insufficient-signal`，说明接近可以进入 UI 讨论，但还需要补真实试跑样本。
- `not-ready`
  基础门槛不足，或跨批次重复摩擦点还不明显，说明当前更适合继续跑产品验证闭环。

## 3. 输入证据来源

批量工作单导出日志：
- `apps/web/outputs/obsidian-export-logs/real-case-batch-fill-sheets`

批次试跑记录导出日志：
- `apps/web/outputs/obsidian-export-logs/real-case-batch-run-records`

跨批次摩擦点汇总：
- `apps/web/outputs/batch-run-friction-summary/batch-run-friction-summary.json`

每条日志读取的关键字段：
- `batchLabel`
- `normalizedLabel`
- `exportedAt`
- `overwrite.actionLabel`
- `readback.ok`
- `targetPath`

## 4. 生成链路

应用层：
- `apps/web/src/application/runUiOptimizationReadinessPreview.js`
- `apps/web/src/application/createUiOptimizationReadinessObsidianPreview.js`
- `apps/web/src/application/exportUiOptimizationReadinessToObsidian.js`

领域层：
- `apps/web/src/domain/ui/buildUiOptimizationReadinessReport.js`
- `apps/web/src/domain/ui/buildUiOptimizationReadinessMarkdown.js`
- `apps/web/src/domain/ui/buildObsidianUiOptimizationReadinessRecord.js`

服务端接口：
- `POST /api/ui-optimization-readiness-preview`
- `POST /api/ui-optimization-readiness-export`

前端接线：
- `apps/web/public/index.html`
- `apps/web/public/app/api.js`
- `apps/web/public/app/createApp.js`
- `apps/web/public/app/dom.js`
- `apps/web/public/app/renderers.js`
- `apps/web/public/app/state.js`

## 5. 前端展现

页面新增一个独立面板：
- 标题：`UI 优化进入条件报告`
- 按钮：`生成 UI 就绪度预览`
- 按钮：`导出 UI 就绪度报告`

预览结果会展示：
- 当前判断
- readiness level
- 四项检查完成情况
- 跨批次重复信号
- 当前风险
- 下一步动作
- 当前证据列表
- Markdown 预览

这样做的目的不是直接给 UI 方案，而是先回答一个更前置的问题：
- 现在是不是已经值得花时间讨论 UI 了？

## 6. 导出与沉淀

代码侧输出目录：
- `apps/web/outputs/ui-readiness/ui-readiness-report.json`
- `apps/web/outputs/ui-readiness/ui-readiness-report.md`
- `apps/web/outputs/obsidian-export-logs/ui-readiness`

Obsidian 默认导出目录：
- `06_PRD与版本记录/UI优化进入条件报告/已生成记录`

Obsidian 文档结构保留人工补充空档：
- 当前最值得优先改的模块
- 当前最应该后置讨论的视觉项
- 是否正式进入 UI 讨论

## 7. 当前产品推进判断

这项能力的作用不是替代 UI 设计，而是给 UI 设计设门槛。

当前建议流程：
1. 先完成 2-3 批真实案例试跑。
2. 每批都至少生成工作单与试跑记录，并确认导出可读回。
3. 再生成跨批次摩擦点汇总，确认重复问题已经出现。
4. 再生成 UI 优化进入条件报告。
5. 只有在报告达到 `ready` 或稳定 `near-ready` 时，再和用户详细讨论 UI 优化方向。

## 8. 后续可扩展方向

- 把“最卡步骤”从人工填写改成批次试跑记录中自动提取。
- 增加“模块级 UI 摩擦点归类”，例如输入区、结果区、回填区、导出区。
- 把 readiness 结果接入版本计划，形成“继续验证 / 进入改版”的分流节点。
- 后续可以再增加一个“UI 改版任务单”，承接 readiness 报告结论，而不是直接在当前报告里堆设计细节。
