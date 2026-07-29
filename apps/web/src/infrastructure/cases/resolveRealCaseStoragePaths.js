import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..", "..", "..", "..");
const realCasesDir = join(__dirname, "data", "real-cases");

export const defaultRealCaseStoragePaths = {
  realCasesDir,
  realCasesIndexPath: join(realCasesDir, "index.json"),
  realCasesItemsDir: join(realCasesDir, "items"),
};
