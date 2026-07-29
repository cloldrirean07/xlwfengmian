import { loadSampleCases } from "../infrastructure/sample-cases/loadSampleCases.js";

export async function listSampleCases() {
  const sampleCases = await loadSampleCases();
  return sampleCases.map((item) => ({
    id: item.id,
    title: item.title,
    platform: item.platform,
    userAssetType: item.userAssetType,
    referencePreference: item.referencePreference,
  }));
}
