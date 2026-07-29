# 真实案例回填工作单确认导出 Obsidian v0.1

## 1. 本次改动解决什么问题

上一轮已经把真实案例回填工作单推进到了：

- 页面可查看单案例回填优先项
- 页面可查看完整回填工作单
- 页面可查看 Obsidian 草稿预览

但当时还停留在“可预览、不可落盘”的阶段。

这次补的是下一步：

**用户在页面里确认这条工作单结构没问题后，可以显式导出到 Obsidian。**

## 2. 为什么要做“确认导出”

这里故意没有做成页面自动写盘，而是保留一个明确动作：

- 先看预览
- 再确认导出

这样做有三个好处：

1. 风险更低，不会把尚未确认的草稿直接写进知识库
2. 链路更清楚，符合当前“先稳结构、再扩能力”的节奏
3. 后续其他导出动作可以复用同样模式

## 3. 新增代码结构

### 3.1 新增应用层导出用例

新增：

- `apps/web/src/application/exportRealCaseFillSheetToObsidian.js`

职责：

- 调用 `runRealCaseFillPreview`
- 复用其中已经生成好的 `obsidianDraft`
- 把草稿 markdown 正式写入目标路径
- 返回导出结果给前端

这样做的关键点是：

- 导出逻辑不重复拼 markdown
- 预览和写入始终基于同一份草稿对象

### 3.2 API 层新增导出入口

新增接口：

- `POST /api/real-case-fill-export`

输入：

- `caseId`

输出：

- `targetPath`
- `sourceMarkdownPath`
- `generatedDate`
- `obsidianDraft`

## 4. 前端接入方式

### 4.1 真实案例概览增加导出按钮

在真实案例卡片上新增：

- `确认导出到 Obsidian`

### 4.2 结果展示分成两层

页面现在会分别展示：

1. `real-case-maintenance-result`
   - 当前最该先补什么
   - 完整回填工作单
   - Obsidian 草稿预览

2. `real-case-export-result`
   - 导出是否完成
   - 导出路径
   - 代码底稿来源
   - 生成日期

### 4.3 为什么单独分区

这是为了保留清晰边界：

- 维护预览是“判断与草稿层”
- 导出结果是“写入确认层”

后续如果要继续补：

- 打开目标文件
- 重新导出覆盖
- 导出历史记录

都可以继续沿这个分层扩，而不需要重拆页面。

## 5. 验证方式

这次不仅做了单元测试，还做了真实导出校验。

验证包括：

- `npm test`
- `node --check public/app/createApp.js`
- `node --check public/app/renderers.js`
- 直接运行 `exportRealCaseFillSheetToObsidian({ caseId: 'real-001' })`

## 6. 当前价值

这次改动意味着真实案例维护链已经从：

- 看缺什么
- 看工作单
- 看 Obsidian 草稿

继续推进到：

- **可以确认导出一份真正可编辑的 Obsidian 草稿**

这让页面工作台和你真正使用的知识库之间，第一次形成了明确的“确认写入”闭环。

## 7. 当前结论

当前真实案例回填链已经具备四层能力：

1. 缺口判断
2. 工作单生成
3. Obsidian 草稿预览
4. 确认导出到 Obsidian

下一步如果继续推进，最自然的是补：

- 导出后重新读取该目标文件的确认结果
- 或导出历史与覆盖策略
