export function isPlatformCasePlaceholder(content) {
  const text = String(content || "");

  return text.includes("# 平台案例占位") && text.includes("- case_id：");
}
