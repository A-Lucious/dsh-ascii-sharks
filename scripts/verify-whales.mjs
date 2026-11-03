import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { World, isWhale } = await server.ssrLoadModule("/src/world.ts");
  const originalKinds = ["classic", "hammerhead", "zebra", "tiger", "greathammer", "mako", "thresher", "nurse"];
  const original = new World();
  original.resize(1280, 800, 10, 15);
  assert.equal(original.sharks.length, 4, "library default retains its four original sharks");
  assert.ok(original.sharks.every((animal) => animal.kind === "classic"));

  for (const kind of [...originalKinds, "humpback", "bluewhale"]) {
    const world = new World([{ kind, size: isWhale(kind) ? 1.65 : 1 }], 30);
    world.resize(1280, 800, 10, 15);
    const animal = world.sharks[0];
    const start = [animal.nodes[0], animal.nodes[1]];
    let eats = 0;
    for (let i = 0; i < 3600; i++) {
      if (i === 120) world.splash(640, 400);
      world.step(1 / 60);
      eats += world.events.filter((event) => event.kind === "eat").length;
      world.events.length = 0;
      assert.ok(animal.nodes.every(Number.isFinite), `${kind}: finite body coordinates`);
      assert.ok(Number.isFinite(animal.speed) && animal.speed > 0, `${kind}: positive finite speed`);
    }
    assert.ok(Math.hypot(animal.nodes[0] - start[0], animal.nodes[1] - start[1]) > 1, `${kind}: swims`);
    if (isWhale(kind)) {
      assert.equal(eats, 0, `${kind}: no inherited shark feeding`);
      assert.equal(animal.target, null, `${kind}: no inherited shark pursuit`);
      assert.ok(world.fish.every((fish) => fish.alive), `${kind}: fish stay alive`);
      assert.ok(animal.speed < 50, `${kind}: slow cruising speed`);
    }
    console.log(`PASS ${kind}: 60 seconds, stable motion${isWhale(kind) ? ", no shark pursuit/feeding" : ""}`);
  }
  for (const kind of ["humpback", "bluewhale"]) {
    const mobile = new World([{ kind, size: 1.65 }]);
    mobile.resize(1440, 900, 12, 17);
    const desktopLength = mobile.sharks[0].length;
    mobile.resize(390, 844, 8, 12);
    assert.ok(mobile.sharks[0].length <= 390 * 0.82, `${kind}: fits narrow viewport`);
    assert.ok(mobile.sharks[0].nodes.every((v, i) => v >= 0 && v <= (i % 2 === 0 ? 390 : 844)), `${kind}: stays visible after desktop-to-mobile resize`);
    mobile.resize(1440, 900, 12, 17);
    assert.equal(mobile.sharks[0].length, desktopLength, `${kind}: restores size after expanding`);
    mobile.resize(844, 390, 8, 12);
    mobile.step(1 / 60);
    assert.ok(mobile.sharks[0].nodes.every(Number.isFinite));
  }
  console.log("PASS original defaults, eight shark species, two whale species, narrow viewport and resize");
} finally {
  await server.close();
}
