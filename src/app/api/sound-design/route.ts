import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { mergeDesign } from '~/game/sound/model';

const DESIGN_FILE = join(process.cwd(), 'src/game/sound/design.json');
const MAX_BODY_BYTES = 1_000_000;

// Saving writes to the source tree, which only exists on a dev machine.
const devOnly = () =>
  process.env.NODE_ENV === 'development'
    ? null
    : Response.json({ error: 'dev only' }, { status: 404 });

/** The saved design, merged onto the base so it's always complete. */
export const GET = async () => {
  const blocked = devOnly();
  if (blocked) return blocked;
  const saved: unknown = JSON.parse(await readFile(DESIGN_FILE, 'utf8'));
  return Response.json(mergeDesign(saved));
};

/**
 * Saves the playground's design to `design.json`, merged onto the base
 * design first so the file is always complete and valid, and formatted the
 * way the repo is.
 */
export const POST = async (request: Request) => {
  const blocked = devOnly();
  if (blocked) return blocked;
  try {
    const body = await request.text();
    if (body.length > MAX_BODY_BYTES) throw new Error('design too large');
    const design = mergeDesign(JSON.parse(body));
    const options = await resolveConfig(DESIGN_FILE);
    const text = await format(JSON.stringify(design), {
      ...options,
      parser: 'json',
    });
    await writeFile(DESIGN_FILE, text);
    return Response.json({ file: 'src/game/sound/design.json' });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 400 });
  }
};
