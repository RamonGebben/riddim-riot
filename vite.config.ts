import { readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import { COLOR_MODE_META } from '@pindakaasman/design-system';
import react from '@vitejs/plugin-react';
import { format, resolveConfig } from 'prettier';
import { defineConfig, type Plugin } from 'vite';
import { mergeDesign } from './src/game/sound/model/index.ts';

const root = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// The game is dark by design: force the theme's dark mode with the design
// system's own override tag, whatever the OS prefers.
const darkMode = (): Plugin => ({
  name: 'dark-color-mode',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { name: COLOR_MODE_META, content: 'dark' },
      injectTo: 'head-prepend',
    },
  ],
});

// Vercel sets this to the shortest production domain, so the custom domain
// becomes canonical once it's attached and vercel.app until then.
const SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'bass-weapons.ra-ge.net'}`;

/**
 * Share cards and crawlers need absolute URLs: fill `%SITE_URL%` in the
 * pages and emit `robots.txt` and `sitemap.xml` for the canonical domain.
 */
const siteMeta = (): Plugin => ({
  name: 'site-meta',
  transformIndexHtml: {
    order: 'pre',
    handler: html => html.replaceAll('%SITE_URL%', SITE_URL),
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
    });
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_URL}/</loc></url>\n</urlset>\n`,
    });
  },
});

const DESIGN_FILE = root('./src/game/sound/design.json');
const MAX_BODY_BYTES = 1_000_000;

const readBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    const chunks: Array<Buffer> = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) reject(new Error('design too large'));
      else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

/**
 * Dev only: the sound playground reads and saves `design.json` through
 * `/__sound-design`. A save is merged onto the base design first, so the
 * file is always complete and valid, and formatted the way the repo is.
 */
const soundDesignFile = (): Plugin => ({
  name: 'sound-design-file',
  apply: 'serve',
  configureServer: server => {
    server.middlewares.use('/__sound-design', async (req, res) => {
      const reply = (status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(body));
      };
      try {
        if (req.method === 'GET') {
          const saved = JSON.parse(await readFile(DESIGN_FILE, 'utf8'));
          return reply(200, mergeDesign(saved));
        }
        if (req.method !== 'POST') return reply(405, { error: 'GET or POST' });
        const design = mergeDesign(JSON.parse(await readBody(req)));
        const options = await resolveConfig(DESIGN_FILE);
        const text = await format(JSON.stringify(design), {
          ...options,
          parser: 'json',
        });
        await writeFile(DESIGN_FILE, text);
        return reply(200, { file: 'src/game/sound/design.json' });
      } catch (error) {
        return reply(400, { error: String(error) });
      }
    });
  },
  // Saving shouldn't reload the playground mid-listen. Mark the design stale
  // so the game picks it up on its next load, but push no update.
  handleHotUpdate: ({ file, modules, server }) => {
    if (file !== DESIGN_FILE) return;
    modules.forEach(module => server.moduleGraph.invalidateModule(module));
    return [];
  },
});

export default defineConfig({
  plugins: [react(), darkMode(), siteMeta(), soundDesignFile()],
  resolve: {
    alias: { '~': root('./src') },
  },
  build: {
    rolldownOptions: {
      input: {
        main: root('./index.html'),
        playground: root('./playground.html'),
      },
      output: {
        // Audio and rendering engines change far less often than game code.
        codeSplitting: {
          groups: [
            { name: 'tone', test: /node_modules[\\/]tone/ },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler)/,
            },
          ],
        },
      },
    },
  },
});
