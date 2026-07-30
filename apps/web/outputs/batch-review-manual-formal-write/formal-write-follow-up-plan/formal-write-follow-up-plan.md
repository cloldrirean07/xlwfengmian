# 正式写回后承接计划

- 状态码：formal-write-follow-up-plan-ready
- 摘要：正式写回后承接计划已生成，规则修订任务单与关键样例复跑计划进入人工复核。
- 写回记录：BRF-2026-07-29T06-53-32-869Z
- 目标记录：/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手/05_验证与实验/批次试跑记录/已生成记录/real-002_to_real-003_批次试跑记录_2026-06-27.md
- 写回后验收：formal-write-post-execution-acceptance-passed
- PI Engine 位点：post-formal-write-follow-up
- 目标完成度：8 / 8
- 安全边界：仅生成正式写回后承接计划，不自动修改规则，不自动执行复跑，不写入 Obsidian。

## 1. 规则修订任务单

- 当前状态：规则修订任务单已生成
- 任务类型：规则修订
- 任务说明：基于 real-002_to_real-003 的正式写回结论，整理可进入规则引擎下一轮调整的重复摩擦点。
- 下一步：整理规则修订任务单
- 命令：npm run report:rule-revision-task-sheet
- 已有任务数：1
- 来源样本数：1
- 优先任务：补强 neg-content-distance 相关关键词：不贴内容
- 关联案例：sample-001

## 2. 关键样例复跑计划

- 当前状态：关键样例复跑计划已生成
- 任务类型：关键样例复跑
- 任务说明：将 real-002_to_real-003 纳入规则调整后的关键样例复跑候选，验证写回判断对主链路的影响。
- 下一步：生成关键样例复跑计划
- 命令：npm run generate:key-case-rerun-plan
- 计划 ID：key-case-rerun-default
- 候选案例：sample-001 / real-001
- 正式写回候选批次：real-002_to_real-003
- 下游刷新：reviewed-misclassified / rule-revision-task-sheet
- 最近复跑：key-case-rerun-default
- 已复跑案例数：2
- 差异案例数：0

## 3. 推荐命令链

- npm run report:rule-revision-task-sheet
- npm run generate:key-case-rerun-plan
- npm run rerun:key-cases
- npm run export:obsidian-key-case-rerun
- npm run export:obsidian-key-case-rerun-diff

## 4. 下一步

- 推荐动作：复核承接计划
- 动作说明：先确认规则修订任务单，再执行关键样例复跑计划。
