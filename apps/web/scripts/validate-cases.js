import { loadAllCases } from "../src/infrastructure/cases/loadCases.js";

async function main() {
  const cases = await loadAllCases();
  const sampleCount = cases.filter((item) => item.sourceType === "sample").length;
  const realCount = cases.filter((item) => item.sourceType === "real").length;

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: cases.length,
        sampleCount,
        realCount,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
