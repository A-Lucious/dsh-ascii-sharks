import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = await build({
  absWorkingDir: root,
  entryPoints: ["dsh-background/client.ts"],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2022",
  minify: true,
  write: false,
});
const manifest = JSON.parse(await readFile(new URL("../dsh-background/package.json", import.meta.url), "utf8"));
const bundle = `// Built from dsh-background/client.ts and the shared ASCII ocean engine.\nwindow.__ModuleLoader__.load({id:${JSON.stringify(manifest.name)},factory:(require)=>{var module={exports:{}};var exports=module.exports;\n${output.outputFiles[0].text}\nreturn module.exports;}});\n`;
await writeFile(new URL("../dsh-background/client.js", import.meta.url), bundle);
console.log(`Built ${manifest.name}: ${(Buffer.byteLength(bundle) / 1024).toFixed(1)} KiB, self-contained browser bundle`);
