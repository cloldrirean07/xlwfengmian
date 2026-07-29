# 真实案例回填工作单 Obsidian 草稿预览接入 v0.1

## 1. 本次改动解决什么问题

在此之前，真实案例维护链已经能做到：

- 从真实案例概览进入单案例回填预览
- 查看“当前最该先补什么”
- 查看完整回填工作单 markdown

但这还停留在“代码侧工作单”层面，没有把它进一步转成你真正会在 Obsidian 里继续编辑的草稿形态。

这次补的是中间这一步：

**单案例回填预览除了显示代码侧工作单，还直接显示对应的 Obsidian 草稿预览。**

## 2. 接入后的链路

当前链路变成：

`真实案例概览 -> 查看这条先补什么 -> 生成回填工作单预览 -> 同时生成 Obsidian 草稿预览`

也就是说，前端现在可以同时回答两个问题：

1. 代码侧判断这条案例现在缺什么
2. 如果把这条工作单导入 Obsidian，草稿会长什么样、准备落到哪里

## 3. 代码分层

### 3.1 新增应用层

新增：

- `apps/web/src/application/createRealCaseFillObsidianPreview.js`

职责：

- 接收 `caseId` 与 `fillSheetMarkdown`
- 解析 Obsidian 根目录
- 生成建议落点路径
- 调用 domain 层草稿拼装器
- 返回前端可直接展示的草稿预览对象

### 3.2 复用现有 domain 层

复用：

- `buildObsidianRealCaseFillSheetRecord`

职责不变：

- 把代码侧的回填工作单 markdown 包装成可继续编辑的 Obsidian 草稿内容

### 3.3 收口到现有单案例回填预览

更新：

- `runRealCaseFillPreview`

现在它除了返回：

- `readiness`
- `fillSheet`
- `fillSheetMarkdown`

还会额外返回：

- `obsidianDraft`

这样前端仍然只需要调用一个单案例回填预览入口，不需要自己拼装 Obsidian 草稿。

## 4. 前端表现

更新：

- `public/app/renderers.js`

在 `renderRealCaseMaintenancePreview` 中，除了原有：

- 当前最该先补的字段
- 完整回填工作单预览

现在还会显示：

- Obsidian 草稿建议落点
- 代码底稿来源
- Obsidian 草稿全文预览

这一步仍然只是预览，不会直接写入 Obsidian。

## 5. 为什么先做预览而不是直接写入

这是刻意保持的边界：

- 先让页面层可见“未来会写成什么”
- 暂不把页面点击直接升级为真实写盘动作

这样做的好处是：

- 结构先稳定
- 风险更低
- 后续如果要加“确认导出到 Obsidian”按钮，只需要在现有预览链路基础上继续扩

## 6. 当前价值

这次改动让真实案例链更接近最终知识库闭环：

- 从“代码侧缺什么”前进到“Obsidian 里怎么继续补”

它对后续最直接的价值是：

1. 让真实案例维护结果更贴近最终使用场景
2. 为未来的正式导出动作保留清晰接口
3. 保持 `application -> domain -> renderer` 的边界，不把知识库格式拼装塞进前端

## 7. 当前结论

现在单案例回填维护已经形成三层结果：

1. 就绪度与优先缺口
2. 代码侧回填工作单
3. Obsidian 草稿预览

这说明真实案例维护链已经从“看问题”继续推进到“准备进入知识库补写”阶段。
