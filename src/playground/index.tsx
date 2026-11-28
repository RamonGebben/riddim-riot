import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STEPS_PER_DIVISION } from '~/game/grid';
import type { Key, ScaleName } from '~/game/music';
import {
  auditionWeapon,
  createPlayground,
  type Audition,
  type FireMode,
  type Playground as Engine,
} from '~/game/playground';
import type { Section } from '~/game/sim/survival';
import {
  BASE_DESIGN,
  mergeDesign,
  SOUND_DESIGN,
  type SoundDesign,
} from '~/game/sound';
import { withValue } from '~/game/sound/schema';
import { rollWeapon } from '~/game/weapons';
import { PlaygroundScreen } from '~/templates/PlaygroundScreen';

const DRAFT_KEY = 'sound-playground-draft';
const ENDPOINT = '/api/sound-design';
/** Wait this long after the last change before rebuilding the sound. */
const APPLY_DELAY_MS = 200;

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
const eightSeeds = () => Array.from({ length: 8 }, randomSeed);

// Drafts are a convenience: if storage is blocked, tuning still works.
const loadDraft = (): SoundDesign | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? mergeDesign(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};
const saveDraft = (design: SoundDesign) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(design));
  } catch {
    // Not remembered across reloads, but nothing else is affected.
  }
};

/**
 * The sound playground page: every value of the sound design on a control,
 * heard live through the game's own voices, saved back for the game to use.
 */
export const Playground = () => {
  const [saved, setSaved] = useState<SoundDesign>(SOUND_DESIGN);
  const [design, setDesign] = useState<SoundDesign>(
    () => loadDraft() ?? SOUND_DESIGN,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'starting' | 'ready'>('idle');
  const [key, setKey] = useState<Key>({ root: 5, scale: 'minor' });
  const [audition, setAudition] = useState<Audition>({
    seed: 42,
    pins: {},
    overrides: {},
  });
  const [drums, setDrums] = useState(true);
  const [section, setSection] = useState<Section>('groove');
  const [fire, setFire] = useState<FireMode>('off');
  const [gainDb, setGainDb] = useState<number | null>(null);
  const [seeds, setSeeds] = useState(eightSeeds);
  const engine = useRef<Engine | null>(null);
  const applied = useRef<{ design: SoundDesign; key: Key } | null>(null);

  // The saved file can be newer than this build (saved from another tab).
  useEffect(() => {
    fetch(ENDPOINT)
      .then(response => (response.ok ? response.json() : null))
      .then(body => body && setSaved(mergeDesign(body)))
      .catch(() => undefined);
  }, []);

  useEffect(() => saveDraft(design), [design]);
  useEffect(() => () => engine.current?.dispose(), []);

  const weapon = useMemo(
    () => auditionWeapon(audition, key, design),
    [audition, key, design],
  );
  const rolled = useMemo(
    () => auditionWeapon({ ...audition, overrides: {} }, key, design).sound,
    [audition, key, design],
  );
  const rolls = useMemo(
    () =>
      seeds.map(seed => ({
        seed,
        name: rollWeapon(seed, key, { pins: audition.pins, design }).name,
      })),
    [seeds, key, audition.pins, design],
  );

  // Rebuild what changed, once the knobs stop moving.
  useEffect(() => {
    if (status !== 'ready' || !engine.current) return;
    const live = engine.current;
    const timer = setTimeout(async () => {
      const last = applied.current;
      if (!last || last.design !== design) await live.setDesign(design);
      if (!last || last.key !== key) await live.setKey(key);
      applied.current = { design, key };
      setGainDb(null);
      setGainDb(await live.setWeapon(weapon));
    }, APPLY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, design, key, weapon]);

  const start = async () => {
    setStatus('starting');
    engine.current = await createPlayground({ design, key });
    applied.current = { design, key };
    setGainDb(await engine.current.setWeapon(weapon));
    setStatus('ready');
  };

  const save = async () => {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(design),
      });
      if (!response.ok) throw new Error(await response.text());
      setSaved(design);
      setMessage(
        'Saved to src/game/sound/design.json - reload the game to hear it',
      );
    } catch {
      setMessage('Saving needs the dev server (pnpm dev) - use Export instead');
    }
  };

  const exportDesign = () => {
    const blob = new Blob([`${JSON.stringify(design, null, 2)}\n`], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'design.json';
    link.click();
    URL.revokeObjectURL(link.href);
    setMessage('Exported design.json');
  };

  const importDesign = async (file: File) => {
    try {
      setDesign(mergeDesign(JSON.parse(await file.text())));
      setMessage(`Imported ${file.name}`);
    } catch {
      setMessage(`${file.name} isn't a design file`);
    }
  };

  const readLevel = useCallback(() => engine.current?.level() ?? -Infinity, []);
  const readRiffNote = useCallback(
    () => engine.current?.riffNote() ?? null,
    [],
  );
  const mountRange = useCallback(
    (element: HTMLElement) =>
      engine.current?.attachRange(element) ?? (() => {}),
    [],
  );

  return (
    <PlaygroundScreen
      status={status}
      onStart={start}
      file={{
        message,
        onSave: save,
        onExport: exportDesign,
        onImport: importDesign,
        onRevert: () => setDesign(saved),
        onBase: () => setDesign(BASE_DESIGN),
      }}
      design={{
        current: design,
        saved,
        onChange: (path, value) => {
          setMessage(null);
          setDesign(current => withValue(current, path, value));
        },
      }}
      track={{
        root: key.root,
        scale: key.scale,
        onKey: (root, scale: ScaleName) => setKey({ root, scale }),
        drums,
        onDrums: on => {
          setDrums(on);
          engine.current?.setDrums(on);
        },
        section,
        onSection: next => {
          setSection(next);
          engine.current?.setSection(next);
        },
        onOneShot: sound => engine.current?.play(sound),
        readLevel,
      }}
      mountRange={status === 'ready' ? mountRange : null}
      weapon={{
        name: weapon.name,
        seed: audition.seed,
        gainDb,
        pins: audition.pins,
        onPins: pins =>
          setAudition(current => ({ ...current, pins, overrides: {} })),
        onSeed: seed =>
          setAudition(current => ({ ...current, seed, overrides: {} })),
        onRoll: () =>
          setAudition(current => ({
            ...current,
            seed: randomSeed(),
            overrides: {},
          })),
        sound: weapon.sound,
        rolled,
        overrides: audition.overrides,
        onOverride: (name, value) =>
          setAudition(current => ({
            ...current,
            overrides: Object.fromEntries(
              Object.entries({ ...current.overrides, [name]: value }).filter(
                ([, kept]) => kept !== undefined,
              ),
            ),
          })),
        riff: {
          notes: weapon.sound.riff,
          every: STEPS_PER_DIVISION[weapon.timing.division],
        },
        readRiffNote,
        rolls,
        onRollMany: () => setSeeds(eightSeeds()),
        fire,
        onFire: mode => {
          setFire(mode);
          engine.current?.setFire(mode);
        },
        onTap: () => engine.current?.tap(),
      }}
    />
  );
};
