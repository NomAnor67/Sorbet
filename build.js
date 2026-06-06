import fs from "fs";
import path from "path";
import esbuild from "esbuild";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const root = process.cwd();
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");
const publicDir = path.join(root, "public");
const sourceCss = path.join(root, "src/index.css");
const sourceIndex = path.join(root, "index.html");
const tailwindConfig = path.join(root, "tailwind.config.js");

const aliasPlugin = {
  name: "alias-plugin",
  setup(build) {
    build.onResolve({ filter: /^@\// }, async (args) => {
      const basePath = path.join(root, "src", args.path.slice(2));
      const extensions = [".tsx", ".ts", ".jsx", ".js"];
      
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        try {
          await fs.promises.stat(fullPath);
          return { path: fullPath };
        } catch {}
      }
      
      return { path: basePath, external: false };
    });
  },
};

const cssNoopPlugin = {
  name: "css-noop",
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, (args) => ({
      path: path.join(args.resolveDir, args.path),
      namespace: "css-noop",
    }));
    build.onLoad({ filter: /\.css$/, namespace: "css-noop" }, () => ({
      contents: "",
      loader: "css",
    }));
  },
};

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function cleanDist() {
  await fs.promises.rm(dist, { recursive: true, force: true });
  await ensureDir(assets);
}

async function buildCss() {
  try {
    const source = await fs.promises.readFile(sourceCss, "utf8");
    console.log(`[CSS] Read source: ${source.length} bytes`);
    const config = (await import(tailwindConfig)).default;
    console.log(`[CSS] Loaded config with ${config.content?.length || 0} content patterns`);
    const result = await postcss([tailwindcss(config), autoprefixer()]).process(source, {
      from: sourceCss,
      to: path.join(assets, "index.css"),
    });
    console.log(`[CSS] PostCSS result: ${result.css.length} bytes`);
    await fs.promises.writeFile(path.join(assets, "index.css"), result.css, "utf8");
  } catch (err) {
    console.error("[CSS] Build error:", err.message);
    throw err;
  }
}

async function copyPublic() {
  if (!(await fs.promises.stat(publicDir).catch(() => false))) {
    return;
  }
  await fs.promises.cp(publicDir, dist, { recursive: true });
}

async function copyIndexHtml() {
  const html = await fs.promises.readFile(sourceIndex, "utf8");
  await fs.promises.writeFile(path.join(dist, "index.html"), html, "utf8");
}

async function buildJs() {
  await esbuild.build({
    entryPoints: [path.join(root, "src/main.tsx")],
    bundle: true,
    minify: true,
    outfile: path.join(assets, "index.js"),
    sourcemap: false,
    platform: "browser",
    target: ["chrome110", "firefox110", "safari16", "edge110"],
    format: "esm",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    loader: {
      ".png": "file",
      ".jpg": "file",
      ".jpeg": "file",
      ".svg": "file",
      ".webp": "file",
      ".gif": "file",
    },
    plugins: [aliasPlugin, cssNoopPlugin],
  });
}

async function run() {
  console.log("[BUILD] Starting...");
  await cleanDist();
  console.log("[BUILD] Starting CSS build...");
  const cssBuild = buildCss().catch(e => { console.error("[CSS] Error:", e); throw e; });
  console.log("[BUILD] Starting JS build...");
  const jsBuild = buildJs().catch(e => { console.error("[JS] Error:", e); throw e; });
  const publicCopy = copyPublic();
  const indexCopy = copyIndexHtml();
  
  await Promise.all([cssBuild, jsBuild, publicCopy, indexCopy]);
  console.log("Build complete: dist/");
}

run().catch((err) => {
  console.error("[BUILD] Fatal error:", err.message);
  process.exit(1);
});

