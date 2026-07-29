import { loadCoverEffectCatalog } from "../../infrastructure/rules/loadRuleCatalog.js";

const coverEffectCatalogSource = loadCoverEffectCatalog();

export const coverEffectCatalog = coverEffectCatalogSource.effects;
export const coverEffectOrder = coverEffectCatalogSource.order;
