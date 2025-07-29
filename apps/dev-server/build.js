import { build, context } from "esbuild";

const isDev = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  outfile: "dist/index.cjs",
  format: "cjs",
  sourcemap: isDev,
  minify: !isDev,
  logLevel: "info",
};

try {
  if (isDev) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await build(buildOptions);
    console.log("Build completed successfully!");
  }
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}
