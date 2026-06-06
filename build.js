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
    build.onResolve({ filter: /^@\// }, (args) => ({
      path: path.join(root, "src", args.path.slice(2)),
      namespace: "file",
    }));
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
  const source = await fs.promises.readFile(sourceCss, "utf8");
  const result = await postcss([tailwindcss(tailwindConfig), autoprefixer()]).process(source, {
    from: sourceCss,
    to: path.join(assets, "index.css"),
  });
  await fs.promises.writeFile(path.join(assets, "index.css"), result.css, "utf8");
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
  await cleanDist();
  await Promise.all([buildCss(), buildJs(), copyPublic(), copyIndexHtml()]);
  console.log("Build complete: dist/");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
