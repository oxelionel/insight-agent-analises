/**
 * Build alternativo, sem Vite: esbuild + compilador do Tailwind CSS v4.
 * Gera:
 *   dist-offline/index.html             (HTML + assets/)
 *   dist-offline/insight-agent.html     (arquivo único, abre com duplo clique)
 *
 * Uso: npm run build:offline
 * Variável opcional: MODULES_DIR=/caminho/node_modules (quando as dependências
 * estão instaladas em outro local).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulesDirs = [path.join(root, 'node_modules'), process.env.MODULES_DIR].filter(Boolean);
const req = createRequire(path.join(modulesDirs.find((d) => fs.existsSync(path.join(d, 'esbuild'))) ?? modulesDirs[0], 'x.js'));

const esbuild = req('esbuild');
const twDir = path.dirname(req.resolve('tailwindcss/package.json'));
const { compile } = await import(pathToFileURL(path.join(twDir, 'dist/lib.mjs')).href);

const out = path.join(root, 'dist-offline');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });

// 1) JavaScript
const result = await esbuild.build({
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  loader: { '.css': 'empty' },
  nodePaths: modulesDirs,
  define: { 'process.env.NODE_ENV': '"production"' },
  platform: 'browser',
  external: ['node:fs', 'node:https', 'fs', 'https', 'image-size'],
  write: false,
  logLevel: 'warning',
  metafile: true,
});
const js = result.outputFiles[0].text;

// 2) CSS com Tailwind: coleta candidatos de classe dos arquivos-fonte
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|html)$/.test(e.name) && files.push(path.join(d, e.name))));
walk(path.join(root, 'src'));
files.push(path.join(root, 'index.html'));
const candidates = new Set();
for (const f of files) {
  for (const tok of fs.readFileSync(f, 'utf8').split(/[\s"'`{}<>=,;]+/)) if (tok && tok.length < 120) candidates.add(tok.replace(/^\(|\)$/g, ''));
}
const cssSource = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
const compiler = await compile(cssSource, {
  base: twDir,
  loadStylesheet: async (id) => {
    const file = id === 'tailwindcss' ? path.join(twDir, 'index.css') : path.join(twDir, id.replace(/^tailwindcss\//, ''));
    return { path: file, base: twDir, content: fs.readFileSync(file, 'utf8') };
  },
});
const css = compiler.build([...candidates]);

// 3) HTML
const favicon = fs.readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const shell = (head, body) =>
  html
    .replace('<link rel="icon" type="image/svg+xml" href="./favicon.svg" />', `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favicon)}" />${head}`)
    .replace('<script type="module" src="/src/main.tsx"></script>', body);

fs.writeFileSync(path.join(out, 'assets/app.js'), js);
fs.writeFileSync(path.join(out, 'assets/app.css'), css);
fs.writeFileSync(path.join(out, 'index.html'), shell('\n    <link rel="stylesheet" href="./assets/app.css" />', '<script src="./assets/app.js"></script>'));
const safeJs = js.replace(/<\/script/gi, '<\\/script');
fs.writeFileSync(path.join(out, 'insight-agent.html'), shell(`\n    <style>${css}</style>`, `<script>${safeJs}</script>`));

console.log(`OK  js ${(js.length / 1024).toFixed(0)} KB · css ${(css.length / 1024).toFixed(0)} KB → dist-offline/`);
