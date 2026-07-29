import { compactText } from "../../shared/text.js";

const fieldPattern = /^-\s*([a-z_]+)[：:]\s*(.*)$/u;

export function parsePlatformCaseNote(markdown) {
  const result = {};
  const lines = String(markdown || "").split("\n");

  for (const line of lines) {
    const match = line.match(fieldPattern);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    result[key] = compactText(rawValue);
  }

  return result;
}
