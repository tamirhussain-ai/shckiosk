import { build } from "esbuild";

const outfile = "dist/checkin-adapter.test.mjs";

await build({
  entryPoints: ["src/lib/checkin-adapter.test.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: "inline",
  outfile,
  logLevel: "silent",
});

await import(`./${outfile}`);