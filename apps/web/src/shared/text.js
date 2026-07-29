export function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function includesAny(text, keywords) {
  const normalized = compactText(text);
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function shortenText(text, length) {
  const normalized = compactText(text);
  if (normalized.length <= length) {
    return normalized;
  }
  return `${normalized.slice(0, length)}...`;
}
