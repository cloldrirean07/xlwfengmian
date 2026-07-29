import { coverEffectCatalog, coverEffectOrder } from "../effects/coverEffectCatalog.js";

export const directionCatalog = Object.fromEntries(
  coverEffectOrder.map((directionId) => {
    const effect = coverEffectCatalog[directionId];

    return [
      directionId,
      {
        id: effect.id,
        internalName: effect.internalName,
        userLabel: effect.userLabel,
        clickDriver: effect.clickDriver,
        defaultRisks: effect.defaultRisks,
        coverCopyTemplates: effect.coverCopyTemplates,
        titleTemplates: effect.titleTemplates,
        visualHints: effect.visualHints,
        compositionHints: effect.compositionHints,
      },
    ];
  }),
);

export const directionOrder = coverEffectOrder;
