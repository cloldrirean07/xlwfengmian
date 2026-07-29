const defaultObsidianRoot =
  "/Users/xlw/Library/Mobile Documents/iCloud~md~obsidian/Documents/Xlwbrain/AI封面创意助手";

export function resolveObsidianRoot(overrideRoot = "") {
  return overrideRoot || process.env.AI_COVER_OBSIDIAN_ROOT || defaultObsidianRoot;
}
