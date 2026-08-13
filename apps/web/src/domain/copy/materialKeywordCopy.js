import { compactText, shortenText } from "../../shared/text.js";
import { titleStyleLibrary } from "./titleStyleLibrary.js";

const materialKeywordLexicon = [
  "辣炒鱿鱼",
  "香辣鱿鱼",
  "鱿鱼",
  "香辣蟹",
  "螃蟹",
  "海鲜",
  "下饭",
  "夜宵",
  "红油",
  "香菜",
  "辣椒",
  "美食",
  "夏日晚霞",
  "晚霞",
  "火烧云",
  "云层",
  "落日",
  "霞光",
  "天空",
  "风景",
  "朋友圈",
  "文案",
  "调色",
  "口播",
  "人物",
  "正脸",
  "半身",
  "表情",
  "五官",
  "镜头表现力",
  "自媒体",
  "不露脸",
  "新手",
  "训练",
  "标准流程",
  "随手拍",
  "生活方式",
  "生活碎片",
  "日常",
  "城市散步",
  "咖啡",
  "窗景",
  "健身房",
  "街景",
  "四宫格",
  "拼图",
  "松弛感",
  "自然光",
  "胶片感",
  "低饱和",
  "AI",
  "封面构思",
  "小红书封面",
  "标题",
];

const genericTopicPatterns = [
  /用 AI 工具快速做一张\.\.\./gu,
  /用 AI 工具快速做一张小红书封面/gu,
  /AI 工具快速做一张小红书封面/gu,
];

const emotionalTitleRules = [
  {
    requiredAny: ["辣炒鱿鱼", "螃蟹", "红油", "香菜", "美食"],
    title: "辣炒的味蕾",
  },
  {
    requiredAny: ["夏日晚霞", "晚霞", "云层", "落日"],
    title: "最后一抹霞光",
  },
  {
    requiredAny: ["口播", "镜头表现力", "自媒体", "不露脸"],
    title: "自然口播训练",
  },
  {
    requiredAny: ["随手拍", "生活方式", "生活碎片", "松弛感"],
    title: "普通随手拍也能做成封面",
  },
];

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function uniqueTitleDetails(items) {
  const seenTitles = new Set();

  return items.filter((item) => {
    if (!item?.title || seenTitles.has(item.title)) {
      return false;
    }
    seenTitles.add(item.title);
    return true;
  });
}

function removeContainedKeywords(keywords) {
  return keywords.filter(
    (keyword, index) =>
      !keywords.some(
        (candidate, candidateIndex) =>
          candidateIndex !== index && candidate.length > keyword.length && candidate.includes(keyword),
      ),
  );
}

export function extractMaterialKeywords(fields, limit = 3) {
  const pool = compactText(
    [
      fields?.assetDescription,
      fields?.userReferencePreference,
      fields?.desiredCoverFeel,
      fields?.assetNotes,
      fields?.contentTopic,
    ].join(" "),
  );

  return removeContainedKeywords(unique(materialKeywordLexicon.filter((keyword) => pool.includes(keyword)))).slice(
    0,
    limit,
  );
}

export function buildMaterialKeywordFocus(fields) {
  const keywords = extractMaterialKeywords(fields, 3);
  if (!keywords.length) {
    return "";
  }

  return shortenText(keywords.join("、"), 14);
}

export function buildEmotionalTitleSeed(fields) {
  const keywords = extractMaterialKeywords(fields, 5);
  const matchedRule = emotionalTitleRules.find((rule) =>
    rule.requiredAny.some((keyword) => keywords.includes(keyword)),
  );

  return matchedRule?.title || compactText(fields?.copyReview?.preferredTitle);
}

function hasAnyKeyword(keywords, candidates = []) {
  return candidates.some((keyword) => keywords.includes(keyword));
}

function hasAnyText(pool, candidates = []) {
  return !candidates.length || candidates.some((keyword) => pool.includes(keyword));
}

export function buildTitleStyleLibraryOptions(fields) {
  return buildTitleStyleLibraryOptionDetails(fields).map((item) => item.title);
}

export function buildTitleStyleLibraryOptionDetails(fields) {
  const keywords = extractMaterialKeywords(fields, 8);
  const pool = compactText(
    [
      fields?.contentTopic,
      fields?.contentGoal,
      fields?.assetDescription,
      fields?.referencePreference,
      fields?.assetNotes,
    ].join(" "),
  );

  if (!keywords.length) {
    return [];
  }

  return unique(
    titleStyleLibrary
      .filter((style) => hasAnyKeyword(keywords, style.requiredAny))
      .flatMap((style) =>
        style.templates
          .filter(
            (template) =>
              hasAnyKeyword(keywords, template.requiredAny) && hasAnyText(pool, template.requiredTextAny),
          )
          .map((template) => ({
            title: template.title,
            sourceType: "style-library",
            sourceLabel: "风格库",
            styleId: style.styleId,
            styleLabel: style.styleLabel,
          })),
      ),
  );
}

export function injectMaterialKeywordsIntoCopy(copy, fields) {
  const normalizedCopy = compactText(copy);
  const focus = buildMaterialKeywordFocus(fields);

  if (!focus || normalizedCopy.includes(focus)) {
    return normalizedCopy;
  }

  const replaced = genericTopicPatterns.reduce(
    (current, pattern) => current.replace(pattern, `${focus}封面`),
    normalizedCopy,
  );

  if (replaced !== normalizedCopy) {
    return replaced;
  }

  return `${normalizedCopy}｜${focus}`;
}

export function buildMaterialAwareTitleOptions(titles, fields) {
  return buildMaterialAwareTitleOptionDetails(titles, fields).map((item) => item.title);
}

export function buildMaterialAwareTitleOptionDetails(titles, fields) {
  const manualPreferredTitle = compactText(fields?.copyReview?.preferredTitle);
  const manualPreferredDetail = manualPreferredTitle
    ? {
        title: manualPreferredTitle,
        sourceType: "manual-review",
        sourceLabel: "人工优选",
        styleLabel: "人工判断",
      }
    : null;
  const styleLibraryTitles = buildTitleStyleLibraryOptionDetails(fields);
  const emotionalTitleSeed = buildEmotionalTitleSeed(fields);
  const emotionalTitleDetail = emotionalTitleSeed
    ? {
        title: emotionalTitleSeed,
        sourceType: "emotional-seed",
        sourceLabel: "情绪标题",
        styleLabel: "素材情绪",
      }
    : null;
  const injectedTitles = titles.map((title) => ({
    title: injectMaterialKeywordsIntoCopy(title, fields),
    sourceType: "material-keyword-fallback",
    sourceLabel: "素材词兜底",
    styleLabel: "基础模板",
  }));

  return uniqueTitleDetails([manualPreferredDetail, ...styleLibraryTitles, emotionalTitleDetail, ...injectedTitles]);
}
