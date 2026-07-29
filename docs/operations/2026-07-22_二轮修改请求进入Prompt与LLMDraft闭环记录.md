# 二轮修改请求进入 Prompt 与 LLM Draft 闭环记录

## 1. 执行依据

- Skill：`ai-pi-engine`
- 模式：维护模式
- Requirement Spec：`docs/prd/AI封面创意助手重做_Requirement_Spec_v0.1.md`
- PRD：`docs/prd/AI封面创意助手_MVP重做_主路径与工作台重做.md`

## 2. 对齐条目

- PRD 4.6：系统应识别用户反馈中的保留项和修改项，并在结果中展示修改依据。
- 架构计划第一段闭环：已采纳建议进入 Prompt / LLM Draft / 二轮修订。

## 3. 本轮实现映射

| Spec / PRD 条目 | 实现位置 | 实现结果 |
| --- | --- | --- |
| 修改项进入生成提示 | `src/domain/prompt/buildPromptPreview.js` | 第二轮 Prompt 增加“用户修改请求”，优先使用 `changeRequest`。 |
| LLM Draft 继承工作区上下文 | `src/application/createLlmDraft.js` | 创建二轮 refinement 时补传 `workspaceResult`。 |
| Prompt 回归测试 | `tests/coverAssistantService.test.js` | 校验第二轮 Prompt 包含“用户修改请求”。 |
| LLM Draft 回归测试 | `tests/coverAssistantService.test.js` | 校验 LLM Draft 返回的 refinement 保留工作区上下文。 |

## 4. 边界

- 未新增 Prompt 页面入口。
- 未改变 LLM Provider 结构。
- 未新增真实模型调用能力。
- 未改变二轮反馈表单字段。

## 5. 验收项

- 第二轮 Prompt 应包含从反馈中识别出的修改请求。
- LLM Draft 二轮结果应与 Prompt 预览一样继承已采纳工作区上下文。
- 未提供工作区结果时，LLM Draft 仍保持原有二轮流程。

