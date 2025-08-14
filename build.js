import esbuild from "esbuild";
import globPlugin from "esbuild-plugin-import-glob";
import tailwindPlugin from "esbuild-plugin-tailwindcss";

const build_options_node = {
  entryPoints: [
    { out: "bin", in: "src/cli/bin.ts" },
    { out: "client", in: "src/client/index.ts" },
    { out: "server", in: "src/server/index.ts" },
  ],
  format: "esm",
  bundle: true,
  write: true,
  outdir: "dist",
  sourcemap: true,
  platform: "node",
  loader: {
    ".sql": "text",
    ".node": "file",
  },
  external: ["better-sqlite3"],
  logLevel: "info",
  plugins: [globPlugin.default()],
  banner: {
    js: `
import { createRequire as topLevelCreateRequire } from 'module';
import { fileURLToPath as topLevelFileURLToPath } from 'url';
import { dirname as topLevelDirname, join as topLevelJoin } from 'path';
const __bundleRequire = topLevelCreateRequire(import.meta.url);
const __bundleFilename = topLevelFileURLToPath(import.meta.url);
const __bundleDirname = topLevelDirname(__bundleFilename);
const __bundleJoin = topLevelJoin;

// Make these variables available globally for compatibility
globalThis.require = __bundleRequire;
globalThis.__filename = __bundleFilename;
globalThis.__dirname = __bundleDirname;
globalThis.join = __bundleJoin;
  `,
  },
};

const build_options_browser = {
  entryPoints: [
    { out: "studio", in: "src/studio/index.tsx" },
    { out: "studio", in: "src/studio/styles.css" },
  ],
  format: "esm",
  bundle: true,
  write: true,
  outdir: "dist",
  sourcemap: true,
  platform: "browser",
  logLevel: "info",
  plugins: [globPlugin.default(), tailwindPlugin()]
}

const dev = process.argv.includes("--watch") || process.argv.includes("--dev");

if (dev) {
  const node_ctx = await esbuild.context(build_options_node);
  const browser_ctx = await esbuild.context(build_options_browser);

  await Promise.all([
    node_ctx.watch(),
    browser_ctx.watch(),
  ]);

  console.log("Watching for changes...");
} else {
  await esbuild.build(build_options_browser);
  await esbuild.build(build_options_node);
}
