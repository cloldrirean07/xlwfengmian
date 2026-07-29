const labelToFieldKey = {
  "内容主题": "content_topic",
  "内容目标": "content_goal_guess",
  "来源链接或素材路径": "link_or_asset_path",
  "主体描述": "subject_description",
  "视觉焦点": "visual_focus",
  "主点击机制": "click_driver_primary",
  "主封面方向": "direction_type_primary",
  "正向反馈词": "likely_positive_feedback",
  "可能调整方向": "possible_adjustment_direction",
  "一句话结论": "one_sentence_summary",
};

export function getPlatformCaseFieldKey(label) {
  return labelToFieldKey[label] || "";
}
