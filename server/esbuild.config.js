const esbuild = require("esbuild");

const buildConfig = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.js",
  platform: "node",
  target: "node16",
  format: "cjs",
  sourcemap: true,
  minify: false,
};

if (process.argv.includes("--dev")) {
  buildConfig.sourcemap = true;
  buildConfig.minify = false;
}

async function runBuild() {
  if (process.argv.includes("--watch")) {
    // Use context for watch mode
    const context = await esbuild.context(buildConfig);
    await context.watch();
    console.log("Watching for changes...");
  } else {
    // Use build for single build
    await esbuild.build(buildConfig);
  }
}

runBuild().catch(() => process.exit(1));
