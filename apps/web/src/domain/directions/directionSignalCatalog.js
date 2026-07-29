import { loadCoverDirectionSignalCatalog } from "../../infrastructure/rules/loadRuleCatalog.js";

const directionSignalCatalogSource = loadCoverDirectionSignalCatalog();

export const directionSignalCatalog = directionSignalCatalogSource.directions;
export const directionSignalOrder = directionSignalCatalogSource.order;
