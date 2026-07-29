import { loadAllCases, loadCaseById } from "../cases/loadCases.js";

export async function loadSampleCases() {
  const cases = await loadAllCases();
  return cases.filter((item) => item.sourceType === "sample");
}

export async function loadSampleCaseById(id) {
  const item = await loadCaseById(id);
  return item?.sourceType === "sample" ? item : null;
}
