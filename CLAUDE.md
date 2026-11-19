# Bass Weapons

<!-- Add project-specific facts here. -->

Browser twin-stick rhythm roguelite. The design is `design-brief-poc.md`; how
the code fits together, what was measured and the roadmap are in
`docs/architecture.md` - read it first when picking the work back up.
Running and controls are in `README.md`.

- **Game code lives in `src/game/<domain>/`** (`rng`, `bus`, `grid`, `clock`,
  `audio`, …), outside the atomic tiers. Each domain's `index.ts` is its only
  public surface; pure pieces use the util shape (`<name>/index.ts` +
  `index.test.ts`). React (`src/app`, `templates`, `atoms`) only renders
  screens and never runs inside the game loop.
- **One clock.** Tone's Transport is the only time source; everything reacts
  to `tick` events on the bus and schedules at `tick.time`. Never use
  `setTimeout` or frame counts for musical timing.
- **Two clocks, one source.** Schedule new sounds at the audio clock
  (`audioNow`, Tone's `immediate()`); simulate and draw at the heard clock
  (`heardNow`, from `getOutputTimestamp()`), which trails it by the output
  latency - otherwise visuals land early, badly so on Bluetooth. Start
  audio with `startAudio` (`src/game/audio`), never Tone's `start()`: it
  reads the output timestamp from the native context inside Tone's
  standardized-audio-context wrapper, which has none of its own. Keep Tone
  on that wrapper - a native context passed to `setContext` broke Firefox
  ("param must be an AudioParam"). Call it first in the click, before
  anything that spends the gesture: a fullscreen request does, and a
  context started after it stays suspended.
- **Keep Tone out of pure modules.** `grid`, `rng`, `bus` and pattern
  generators must not import `tone` (directly or through a domain `index.ts`
  that does), so they run in the Node `unit` Vitest project.
- **Voices never create nodes per hit.** Tone's instruments (`Synth`,
  `MonoSynth`, `MembraneSynth`, `MetalSynth`, `NoiseSynth`, …) start fresh
  source nodes on every note, and some are never released: the graph grows
  until the audio crackles. Build voices from always-running sources gated by
  `createGate` (`src/game/audio/gate`), so a hit only reschedules envelopes.
- **Weapon loudness is measured, not estimated.** `measureWeaponLoudness`
  renders a bar offline when a weapon is armed. `Offline` swaps Tone's global
  context while building its graph, so never run two at once (the loadout
  arms slots sequentially).
- **No sound value in code.** Every number that shapes the sound belongs in
  `SoundDesign` (`src/game/sound/model`) with a control in `DESIGN_SCHEMA`
  (tests enforce one per value), so the playground can tune it. The game
  plays `SOUND_DESIGN` (base merged with `design.json`).
- **Keep `design.json` out of the Vite config's imports.** The config imports
  `sound/model` for the save endpoint; importing anything that reaches
  `design.json` would restart the dev server on every playground save.
- **Pinned:** `eslint@^9` (peer of `@pindakaasman/eslint-config`) and
  `typescript@~6.0` (typescript-eslint supports `<6.1`).
- **Dark only.** The theme's dark mode is forced by a
  `<meta name="ds-color-mode" content="dark">` (Vite plugin in
  `vite.config.ts`, `.storybook/preview-head.html`).
- **`createGlobalStyle` templates must differ in text.** styled-components
  derives a global style's id from its template, so two styles with the same
  text collide and only one is injected - give each a distinguishing comment.
- **Pixi filter shaders compile as GLSL ES 1.0 too:** no array constructors,
  and uniforms shared with the vertex stage need `highp`.
- `?stress` fills the level to the 30-enemy cap from the first bar (chargers
  included), for frame-rate checks.
- **React never runs per frame.** The play loop publishes a `HudView`
  (`src/game/hud`) only when it changes; App holds the run and restarts the
  game per level.
- `test` runs only the `unit` Vitest project; `test:storybook` runs the
  browser-based story tests.

## Conventions (via mise)

<!-- mise:plugins:start -->

This project uses mise's coding conventions, installed as Claude Code
plugins. Invoke a skill as `/<plugin>:<skill>`, or let Claude reach for it
automatically.

- **typescript**
  - `conventions` — Type declaration style, enums, any/unknown and Array<T> - stated TypeScript preferences, split between what ESLint enforces and what needs judgment
  - `setup` — Install and wire up @pindakaasman/tsconfig, @pindakaasman/eslint-config and @pindakaasman/prettier-config in the current project, and migrate existing code onto the TypeScript conventions
- **architecture**
  - `data-flow` — Reads and writes both through tRPC, loading/error state threaded explicitly through props, and Context reserved for values that never change
  - `design-system` — The published @pindakaasman/design-system package - a typed accessor over theme tokens with one modular scale scaled by the root font size, light/dark color modes and a WCAG token audit - and how it's scaffolded and provided as the styled-components theme - see /Users/ramon/.claude/plugins/marketplaces/mise/packages/design-system/README.md
  - `folder-structure` — Where things live - atomic design layout, component/hook/util folder shapes, and app-level providers
  - `functional-style` — General code-style preferences - arrow functions, array methods over loops, composition, early returns
  - `module-boundaries` — What's public vs. private - component/package import boundaries and the one-way atomic tier dependency direction
  - `setup` — Scaffold and migrate the current project onto the atomic folder structure and the design-system theme, and audit existing code against the functional-style, state, module-boundary and data-flow conventions
  - `state-management` — Jotai vs Zustand, where client state lives relative to [[folder-structure]], and keeping server-cache data out of it
  - `styling` — styled-components conventions - the SSR registry and the Server/Client Component boundary. See [[design-system]] for how theme tokens are structured and accessed.
- **react**
  - `component-patterns` — Loading/empty/loaded branching, and when a render-body helper should be a real subcomponent instead
  - `setup` — Audit existing components against component-patterns and migrate violations - no install, no scaffold
- **testing**
  - `conventions` — Which tool tests what - Vitest for pure logic, Storybook for component behavior, Playwright for e2e user tasks
  - `setup` — Install Vitest always, Storybook and Playwright only when the project actually has a UI or pages to exercise, and migrate misplaced tests
- **verification**
  - `conventions` — What to run to verify a change and when - related tests while developing, the pre-commit gate before every commit, e2e/Storybook when a change touches them, and how to handle a failing check
  - `setup` — Install husky + lint-staged as the pre-commit gate (format, lint, typecheck, full test suite) and add the standard verification scripts

Re-run `/init:setup` after installing or updating a mise plugin to refresh
this section.
<!-- mise:plugins:end -->
