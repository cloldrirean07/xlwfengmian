# 关键样例复跑报告

## 汇总
- 生成时间：2026-07-30 09:01:51
- 复跑计划：key-case-rerun-default
- 计划样例数：4
- 实际复跑数：4
- sample 数：1
- real 数：3

## 本次计划说明
- 规则升级后优先复跑的关键样例清单，用于刷新方向判断、误判样本导出和规则修订任务单。
- 下游刷新目标：reviewed-misclassified / rule-revision-task-sheet

## 样例结果
### sample-001
- 标题：为什么你总觉得自己很忙但没结果
- 来源类型：sample
- 平台：抖音
- 规则版本：c18a3eda29
- 首轮主方向：更有收获感
- 首轮命中信号：内容目标里已经带明确结果导向 / 用户描述了希望用户获得什么收获
- 二轮选中卡片：B
- 二轮选中方向：更让人想点开
- 当前负向映射：neg-too-salesy
- 输出目录：/Users/xlw/Documents/codex1/AI封面创意助手项目/ai-cover-creative-assistant/apps/web/outputs/case-runs/sample-001

### real-002
- 标题：P-02 美食封面制作真实案例
- 来源类型：real
- 平台：抖音
- 规则版本：c18a3eda29
- 首轮主方向：更有冲击力
- 首轮命中信号：待补充
- 二轮选中卡片：B
- 二轮选中方向：更清楚重点
- 当前负向映射：neg-content-distance
- 输出目录：/Users/xlw/Documents/codex1/AI封面创意助手项目/ai-cover-creative-assistant/apps/web/outputs/case-runs/real-002

### real-003
- 标题：P-03 夏日晚霞封面制作真实案例
- 来源类型：real
- 平台：抖音
- 规则版本：c18a3eda29
- 首轮主方向：更让人想点开
- 首轮命中信号：用户偏好里已有「小红书风景封面方向，突出夏日晚霞的氛围感、治愈感和标题辨识度，避免只有风景但缺少点击理由。」这类抓眼诉求
- 二轮选中卡片：B
- 二轮选中方向：更清楚重点
- 当前负向映射：neg-content-distance
- 输出目录：/Users/xlw/Documents/codex1/AI封面创意助手项目/ai-cover-creative-assistant/apps/web/outputs/case-runs/real-003

### real-001
- 标题：P-01 待补真实案例
- 来源类型：real
- 平台：抖音
- 规则版本：c18a3eda29
- 首轮主方向：更清楚重点
- 首轮命中信号：当前内容需要更快讲明白 / 现有素材是截图，更适合先做信息提炼
- 二轮选中卡片：B
- 二轮选中方向：更高级专业
- 当前负向映射：neg-content-distance
- 输出目录：/Users/xlw/Documents/codex1/AI封面创意助手项目/ai-cover-creative-assistant/apps/web/outputs/case-runs/real-001

## 下游刷新结果
- reviewed-misclassified：1 条可导出误判样本
- rule-revision-task-sheet：1 条规则修订任务

