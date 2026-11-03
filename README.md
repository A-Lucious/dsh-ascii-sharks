# ASCII Sharks — 海洋背景

## 来源与许可 / Attribution

本项目基于 **[stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks.git)** 开发，保留原始 Git 历史和 [MIT 许可证](LICENSE)。原始代码版权归许可证中列明的作者 drewdi 所有。

This project is derived from [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks.git). The original Git history, copyright notice, and MIT license are preserved.

当前版本在原有 ASCII 鲨鱼与鱼群效果基础上，增加座头鲸、蓝鲸，以及用于 DeepSeek Harness (DSH) 的海洋背景插件；支持浅色/深色主题、后台暂停和减少动态效果偏好。

```
                            ;'
                             %%'
                              .t;.               .oooo
                               S;:S%              %8S8.
                                ;:tt%t '..        XX%%S
t'                            ''XSSS8SSX%XX8#.    %XSX%
 :;'               ;.''X8%8XX%%S%%S%SStt%tSX8S#X8't%ttt.
  ::%'       ''8XXXSSt%Stttttt%8@%%@%8@8%Sttt%%%%SSSSS%tt.
  'SXXtt%t%%%S%:;StS%ttSS%tSXSt88@@%8%@8%tStS%%X%SS%%S%;;t
 .@##88#@...'@@@@#@8@88X88#XXXSX8SX88SX8%SS%S%%S88St%t%%%.
  %;%t             :.    '.'##@###@X#888XX##8@@@#.X%XS%.
 .%t                            ;%%%#@@##@@@.     SXS%%
 t.                            .%;%%%.            %%XXS
                              '%t:t              .SXSS'
                             '::.                ooooo
                            .S'
                            .
```

Fish, sharks, humpback whales and blue whales drawn as ASCII on a canvas. Zero runtime dependencies.

```sh
npm install && npm run dev
```

```ts
import { OceanEngine } from "./src";

const engine = new OceanEngine(canvas, [{ kind: "hammerhead", size: 1 }]);
```

The demo starts with the original four sharks plus a humpback and a blue whale, with no navigation buttons. Optional URL parameters still select the mixed ocean, original sharks, or either whale on its own:

- `?scene=mixed` — four sharks and both whales.
- `?scene=sharks` — the original four-shark scene.
- `?scene=humpback` — long pale flippers, a broad notched fluke and a knobbly head.
- `?scene=bluewhale` — a longer slate-blue body, mottled skin and short swept flippers.

Existing `?sharks=hammerhead,mako,nurse` links still work. Both `humpback` and `bluewhale` can also appear in this list.

```ts
const engine = new OceanEngine(canvas, [
  { kind: "classic", size: 1 },
  { kind: "humpback", size: 1.35 },
  { kind: "bluewhale", size: 1.65 },
]);

// Clean up observers, input listeners and animation when unmounting.
engine.destroy();
```

Whales cruise slowly with wider turns and a vertical tail beat represented by subtle foreshortening from above. They do not inherit shark pursuit or single-fish feeding. The library's no-argument roster remains the original four sharks; the mixed roster belongs to the demo. `SharkSpec` accepts both sharks and whales; `OceanKind` and `WhaleKind` are also exported. Give the canvas a CSS width, height and monospace font.

Verification:

```sh
npm run typecheck
npm run build
node scripts/verify-whales.mjs
```

The simulation check runs all ten species for 60 simulated seconds each and checks whale behavior and viewport resizing. Browser screenshots and interaction verification are saved in `artifacts/` during local development.

DSH background:

```sh
npm exec -- tsc --noEmit -p dsh-background/tsconfig.json
node scripts/build-dsh-background.mjs
```

`dsh-background/` is a self-contained DSH browser plugin built from the same ocean engine. It draws four sharks, a humpback and a blue whale behind the interface, without random accent glyph colors or scene buttons. Light mode uses pale monochrome silhouettes; dark mode retains dim blue-grey species tints. Inputs, cards, menus and side panels retain their own surfaces and the user's existing theme preference. The background is inert, registers no pointer handlers, caps rendering at 30 fps and DPR 1, pauses when the document is hidden, and respects reduced-motion preferences.

To enable it, add the following entry under `plugins` in your DSH Web profile's `cordis.patch.yml` (usually `~/.dsh/profiles/web/cordis.patch.yml`). Replace `/absolute/path/to/ascii-sharks` with your checkout path:

```yaml
- insert:
    - id: ascii-ocean-background
      name: /absolute/path/to/ascii-sharks/dsh-background/host.js
      disabled: false
```

Set `disabled: true` or remove that entry to unload the plugin and restore the original base background. It needs neither the demo server nor a replacement DSH server. Reload the existing DSH page after deployment. For later rebuilds of an already loaded bundle, notify DSH's rebuild hook or reload the Host before refreshing, because the Host snapshots client artifacts. A full DSH source checkout can drive that hook with its `dev:web` watcher. There is no such watcher in this installed npm runtime; the initial activation here loads the already-built bundle.

`node scripts/verify-dsh-background.mjs` checks the current DSH at `http://127.0.0.1:3080/`. Provide `PLAYWRIGHT_MODULE` when Playwright is outside the project and either `DSH_BROWSER_STORAGE_STATE` or `DSH_BROWSER_AUTH_HELPER` for a locally authenticated test context. The helper exports `authorize(browserContext)`; credentials are used only in memory and are never logged or stored in verification artifacts. Verification must open the real DSH page without injecting the background so it tests the installed plugin, plus a separate isolated context for teardown.

MIT
