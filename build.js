import esbuild from "esbuild";
import globPlugin from "esbuild-plugin-import-glob";

const build_options = {
  entryPoints: [
    { out: "bin", in: "src/bin.ts" },
    { out: "index", in: "src/index.ts" },
  ],
  format: "esm",
  bundle: true,
  write: true,
  outdir: "dist",
  platform: "node",
  loader: {
    ".sql": "text",
  },
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

const dev = process.argv.includes("--watch") || process.argv.includes("--dev");

if (dev) {
  const ctx = await esbuild.context(build_options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(build_options);
}
