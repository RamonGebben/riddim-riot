# Bass Weapons

A top-down, twin-stick rhythm roguelite in the browser. Every weapon is a
dubstep bass synth and every shot is quantized to the beat, so your fighting
writes the track. The design is in [`design-brief-poc.md`](design-brief-poc.md);
how the code fits together is in [`docs/architecture.md`](docs/architecture.md).

## Run it

```sh
pnpm install
pnpm dev            # http://localhost:5173
```

Press **Press to start** (browsers only start audio from a click), then play.

Each level is a song: survive the waves, clear enough of them to light the
exit pad, and step on it for the next level (new layout, key and palette).
Your health, score and weapons carry over. Five hits and the run is over.

| URL         | What it does                                                                  |
| ----------- | ----------------------------------------------------------------------------- |
| `/?seed=42` | Play a specific level. A number or any word (`?seed=wobble`)                  |
| `/?stress`  | Fill the level to the 30-enemy cap from the first bar, for performance checks |

## Sound playground

Open <http://localhost:5173/playground.html> while `pnpm dev` runs, press
**Start audio**, and tune by ear. Every value that shapes the sound is on
a control, and you hear it through the game's own voices, drums and
arrangement at 140 BPM.

1. **Listen.** Pick a key, switch the drums and the section (calm, groove,
   build, drop), and fire one-shots: impact, reload, riser, drop hit.
2. **Pick a weapon.** Roll seeds, or step through them, and pin any part
   (engine, manufacturer, LFO rate, FX) to hear just that kind. **Hold** or
   **Mash** fires hands-free while you turn knobs. **Compare rolls** lines
   up eight seeds from the current design.
3. **Shape the sound.** The right-hand groups are the engines, the weapon
   mix and loudness target, the parts pool (the ranges rolls land in),
   drums, kill impact, reload and arrangement. Changed values are marked,
   counted per group, and can be reset per group.
4. **Save to game.** Writes `src/game/sound/design.json`; reload the game to
   play with it. **Export** / **Import** move a design as a file; drafts are
   kept in the browser between reloads.

"This roll's sound" tweaks only the weapon you're listening to. To change
what every roll can sound like, change the parts pool ranges instead.

## Controls

| Input                         | Action                                        |
| ----------------------------- | --------------------------------------------- |
| WASD / arrow keys             | Move                                          |
| Mouse                         | Aim                                           |
| Left mouse (click or hold)    | Fire, quantized to the weapon's beat division |
| 1 / 2 / 3, Q / E, mouse wheel | Switch weapon slot                            |
| F                             | Take the weapon you're standing on            |

## Scripts

| Script                         | Runs                                    |
| ------------------------------ | --------------------------------------- |
| `pnpm dev`                     | Vite dev server                         |
| `pnpm build`                   | Typecheck and production build          |
| `pnpm format` / `format:write` | Prettier check / fix                    |
| `pnpm lint`                    | ESLint                                  |
| `pnpm typecheck`               | `tsc --noEmit`                          |
| `pnpm test`                    | Vitest unit tests (Node, no DOM)        |
| `pnpm test:storybook`          | Storybook interaction tests in Chromium |
| `pnpm test:e2e`                | Playwright end-to-end tests             |
| `pnpm storybook`               | Storybook on port 6006                  |

A husky + lint-staged pre-commit hook runs Prettier, ESLint, typecheck and
the unit tests on every commit. Never bypass it.

## Stack

TypeScript, [Tone.js](https://tonejs.github.io/) (audio and the one musical
clock), [PixiJS](https://pixijs.com/) (WebGL rendering and the fullscreen
shader), React with styled-components and `@pindakaasman/design-system`
(screens only, never the game loop), Vite, Vitest, Storybook and Playwright.
Coding conventions come from the [mise](https://github.com/RamonGebben/mise)
plugins listed in [`CLAUDE.md`](CLAUDE.md).
