const fieldPattern = /^(\s*-\s*([a-z_]+)[：:]\s*)(.*)$/u;

export function applyPlatformCaseDraftUpdates(markdown, updates) {
  const lines = String(markdown || "").split("\n");

  return lines
    .map((line) => {
      const match = line.match(fieldPattern);
      if (!match) {
        return line;
      }

      const [, prefix, fieldKey] = match;
      if (!(fieldKey in updates)) {
        return line;
      }

      return `${prefix}${updates[fieldKey]}`;
    })
    .join("\n");
}
