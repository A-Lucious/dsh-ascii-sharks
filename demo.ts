/// <reference types="vite/client" />
import { OceanEngine, type OceanKind, type SharkSpec } from "./src";

const classics: SharkSpec[] = [
  { kind: "classic", size: 1 },
  { kind: "classic", size: 0.7 },
  { kind: "classic", size: 0.84 },
  { kind: "classic", size: 0.77 },
];
const whales: SharkSpec[] = [
  { kind: "humpback", size: 1.35 },
  { kind: "bluewhale", size: 1.65 },
];
const scenes: Record<string, SharkSpec[]> = {
  mixed: [...classics, ...whales],
  sharks: classics,
  humpback: [whales[0]],
  bluewhale: [whales[1]],
};
const allowedKinds = new Set<OceanKind>([
  "classic", "hammerhead", "zebra", "tiger", "greathammer", "mako", "thresher", "nurse", "humpback", "bluewhale",
]);
const params = new URLSearchParams(location.search);
const requestedScene = params.get("scene") ?? "mixed";
const scene = Object.hasOwn(scenes, requestedScene) ? requestedScene : "mixed";
// Keep existing ?sharks= links working, including the new whale kinds.
const kinds = params.get("sharks")?.split(",").filter((kind): kind is OceanKind => allowedKinds.has(kind as OceanKind));
const residents = kinds?.length
  ? kinds.map((kind, i) => ({ kind, size: Math.max(0.3, 1 - i * 0.1) * (kind === "bluewhale" ? 1.65 : kind === "humpback" ? 1.35 : 1) }))
  : scenes[scene] ?? scenes.mixed;

const engine = new OceanEngine(document.querySelector("canvas")!, residents);
if (import.meta.hot) import.meta.hot.dispose(() => engine.destroy());
