import fs from "fs";
import path from "path";
import esbuild from "esbuild";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(__filename);
const dist = path.join(root, "dist");
const assets = path.join(dist, "assets");

console.log(`[BUILD] Root: ${root}`);

async function clean() {
  console.log("[CLEAN] Removing dist...");
  await fs.promises.rm(dist, { recursive: true, force: true });
  await fs.promises.mkdir(assets, { recursive: true });
}

async function copyPublic() {
  console.log("[COPY] Copying public/...");
  const publicDir = path.join(root, "public");
  if (fs.existsSync(publicDir)) {
    await fs.promises.cp(publicDir, dist, { recursive: true });
  }
}

async function copyIndex() {
  console.log("[COPY] Copying index.html...");
  const src = path.join(root, "index.html");
  const dst = path.join(dist, "index.html");
  await fs.promises.copyFile(src, dst);
}

async function buildCSS() {
  console.log("[CSS] Building CSS...");
  const sourceCss = path.join(root, "src", "index.css");
  const outPath = path.join(assets, "index.css");
  
  const source = await fs.promises.readFile(sourceCss, "utf8");
  const configPath = path.join(root, "tailwind.config.js");
  const config = (await import(configPath)).default;
  
  const result = await postcss([
    tailwindcss(config),
    autoprefixer()
  ]).process(source, {
    from: sourceCss,
    to: outPath
  });
  
  await fs.promises.writeFile(outPath, result.css, "utf8");
  const stat = await fs.promises.stat(outPath);
  console.log(`[CSS] Complete: ${stat.size} bytes`);
}

async function buildJS() {
  console.log("[JS] Building JS...");
  
  const aliasPlugin = {
    name: "alias",
    setup(build) {
      build.onResolve({ filter: /^@\// }, async (args) => {
        const base = path.join(root, "src", args.path.slice(2));
        for (const ext of [".tsx", ".ts", ".jsx", ".js"]) {
          const full = base + ext;
          if (fs.existsSync(full)) return { path: full };
        }
        return null;
      });
    }
  };

  await esbuild.build({
    entryPoints: [path.join(root, "src", "main.tsx")],
    bundle: true,
    minify: true,
    outfile: path.join(assets, "index.js"),
    platform: "browser",
    target: ["es2020"],
    define: {
      "process.env.NODE_ENV": '"production"'
    },
    loader: {
      ".png": "file",
      ".jpg": "file",
      ".svg": "file",
      ".webp": "file"
    },
    plugins: [aliasPlugin]
  });
  
  const stat = await fs.promises.stat(path.join(assets, "index.js"));
  console.log(`[JS] Complete: ${stat.size} bytes`);
}

async function main() {
  try {
    console.log("[BUILD] START");
    await clean();
    await copyPublic();
    await copyIndex();
    await buildCSS();
    await buildJS();
    console.log("[BUILD] SUCCESS");
  } catch (e) {
    console.error("[BUILD] ERROR:", e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

main();

