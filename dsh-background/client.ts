import { OceanEngine } from "../src/engine";
import type { SharkSpec } from "../src/world";

export const name = "ascii-ocean-background";
export const inject = ["theme"];

const RESIDENTS: SharkSpec[] = [
  { kind: "classic", size: 1 },
  { kind: "classic", size: 0.7 },
  { kind: "classic", size: 0.84 },
  { kind: "classic", size: 0.77 },
  { kind: "humpback", size: 1.35 },
  { kind: "bluewhale", size: 1.65 },
];

const CSS = `
body[data-dsh-ocean-background] { background: #f8fafc; }
body[data-dsh-ocean-background][data-ds-dark-theme] { background: #090e15; }
body[data-dsh-ocean-background] #root { position: relative; z-index: 1; }
#dsh-ascii-ocean-background {
  position: fixed; inset: 0; z-index: 0; overflow: hidden;
  pointer-events: none; user-select: none; contain: strict;
}
#dsh-ascii-ocean-background canvas {
  display: block; width: 100%; height: 100%; pointer-events: none;
  font-family: ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, monospace;
  opacity: 0.24; filter: invert(1) grayscale(1);
}
body[data-ds-dark-theme] #dsh-ascii-ocean-background canvas { opacity: 0.46; filter: none; }
@media (max-width: 640px) {
  #dsh-ascii-ocean-background canvas { opacity: 0.18; }
  body[data-ds-dark-theme] #dsh-ascii-ocean-background canvas { opacity: 0.34; }
}
`;

type PluginContext = {
  effect(setup: () => () => void): void;
  theme: {
    overrideTokens(source: string, tokens: Record<string, { light: string; dark: string }>): () => void;
  };
};

export function apply(ctx: PluginContext) {
  ctx.effect(() => {
    const layer = document.createElement("div");
    layer.id = "dsh-ascii-ocean-background";
    layer.setAttribute("aria-hidden", "true");
    layer.setAttribute("inert", "");
    const canvas = document.createElement("canvas");
    layer.append(canvas);
    const style = document.createElement("style");
    style.dataset.plugin = "dsh-ascii-ocean-background";
    style.textContent = CSS;
    document.head.append(style);
    document.body.prepend(layer);
    document.body.setAttribute("data-dsh-ocean-background", "");

    let restoreTokens: (() => void) | undefined;
    let engine: OceanEngine | undefined;
    const cleanup = () => {
      engine?.destroy();
      restoreTokens?.();
      layer.remove();
      style.remove();
      document.body.removeAttribute("data-dsh-ocean-background");
    };
    try {
      // Only the base canvas becomes transparent. Cards, inputs, menus and side
      // panels keep their own surface tokens and the user's selected palette.
      restoreTokens = ctx.theme.overrideTokens("dsh-ascii-ocean-background", {
        "--dsw-alias-bg-base": { light: "transparent", dark: "transparent" },
      });
      engine = new OceanEngine(canvas, RESIDENTS, { interactive: false, maxFps: 30, maxDpr: 1 });
    } catch (error) {
      cleanup();
      throw error;
    }
    return cleanup;
  });
}
