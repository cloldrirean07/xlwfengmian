# AI封面创意助手_MVP素材样本标注表结构 v0.1

- 生成时间：2026-08-10
- 文档目的：定义 20-40 条 MVP 创意参考素材样本的标注表结构，并承接第一批样本采集。
- 数据落点：
  - `apps/web/data/creative-reference-library/schema.v0.1.json`
  - `apps/web/data/creative-reference-library/mvp-seed-batch.v0.1.json`
- 执行计划：
  - `AI封面创意助手_MVP素材样本人工采集与验证计划_v0.1.md`

## 1. 标注目标

MVP 阶段不追求素材库数量，而是建立一批能训练判断的小而精样本。

每条样本必须帮助系统回答：

1. 这条内容更适合什么封面方向。
2. 现有素材能不能直接使用。
3. 如果不能直接使用，是裁切、补图，还是做创意概念图。
4. 可借鉴的是构图、标题区、主体关系、情绪氛围，还是点击机制。

## 2. 样本来源类型

| 枚举值 | 用户可见名称 | 说明 |
| --- | --- | --- |
| `current-asset` | 当前素材优化 | 用户自己的实拍图、截图、产品图、口播画面 |
| `platform-sample` | 平台样本借鉴 | 小红书、抖音、B站、YouTube、Instagram 等平台样本 |
| `creative-reference` | 创意参考素材库 | 摄影作品集、海报设计、品牌视觉、杂志封面等 |
| `ad-creative-case` | 广告创意拆解 | 经典广告、创意奖项案例、品牌传播案例 |

## 3. 最小字段

每条样本必须具备以下字段：

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `sampleId` | string | 是 | 样本编号，例如 `mvp-ref-001` |
| `collectionStatus` | enum | 是 | `seeded-existing-case` / `to-collect` / `collected` / `rejected` |
| `referenceSourceType` | enum | 是 | 素材来源类型 |
| `sourceLabel` | string | 是 | 来源名称，例如“小红书美食热门封面” |
| `sourceUrlOrPath` | string | 否 | 来源链接或本地路径 |
| `sourceTraceNote` | string | 是 | 来源可追溯说明 |
| `platformFit` | array | 是 | 适合平台 |
| `contentScene` | string | 是 | 内容场景，例如美食分享、风景治愈、知识教程 |
| `subScene` | string | 否 | 细分场景，例如晚霞、辣炒海鲜、工具教程 |
| `visualSubject` | string | 是 | 视觉主体 |
| `compositionPattern` | string | 是 | 构图方式 |
| `titleZone` | string | 是 | 标题区位置 |
| `emotionMood` | string | 是 | 情绪氛围 |
| `coverDirectionFit` | array | 是 | 对应封面方向 |
| `assetActionFit` | array | 是 | 可训练的素材动作 |
| `borrowablePoints` | array | 是 | 可借鉴点 |
| `doNotCopyBoundary` | string | 是 | 不可复制边界 |
| `suitableUserInput` | string | 是 | 适合哪类用户输入 |
| `labelPriority` | enum | 是 | `P0` / `P1` / `P2` / `P3` |
| `reviewOwner` | string | 否 | 后续复核人 |
| `reviewNotes` | string | 否 | 人工复核备注 |

## 4. 推荐字段

有条件时补充：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `dominantColors` | array | 主色或色彩倾向 |
| `textDensity` | enum | `low` / `medium` / `high` |
| `visualDensity` | enum | `low` / `medium` / `high` |
| `clickMechanism` | array | 看懂、收益、好奇、冲击、质感、信任 |
| `riskNotes` | string | 可能误用风险 |
| `matchedRealCaseIds` | array | 可关联真实案例 |
| `referenceTags` | array | 检索标签 |

## 5. MVP 第一批配比

第一批建议 24 条，先保持轻量：

```text
当前素材优化：4 条
平台样本借鉴：8 条
创意参考素材库：8 条
广告创意拆解：4 条
```

这样能覆盖：

- 用户自己的素材
- 平台点击习惯
- 视觉质感来源
- 创意机制来源

## 6. 第一批采集方式

### 6.1 已有样本

先纳入当前项目已有真实案例：

- `real-002`：美食螃蟹与辣炒鱿鱼
- `real-003`：夏日晚霞

### 6.2 待采集样本

后续采集时每条样本只需要先补齐：

1. 来源链接或本地截图路径。
2. 一句话说明为什么值得纳入。
3. 视觉主体。
4. 构图方式。
5. 适合训练的封面方向。
6. 可借鉴点和不可复制边界。

## 7. 使用边界

1. 标注样本用于训练产品判断，不代表直接复制素材。
2. 外部素材必须记录来源链接或截图路径。
3. 不能只写“好看”，必须说明它训练哪类封面判断。
4. 无法确认来源的素材先标为 `to-collect`，不进入正式样本。
5. 当前 MVP 只用作人工判断和规则整理，不做公开素材展示。
