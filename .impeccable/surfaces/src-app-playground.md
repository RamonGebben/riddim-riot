---
version: 1
slug: 'src-app-playground'
primary_target: 'src/app/playground'
related_targets: ['src/playground', 'src/templates/PlaygroundScreen']
---

# Sound playground

Scope: `/playground` (dev tool, Operate). Audience: the developer designing the base sound profiles in `SoundDesign`. Job: see what a value does, play the weapon as in the game, and always know whether a change is to the base design or to one weapon.

## Direction contract

THESIS: A bass-synth front panel (Monique's layout and density) whose curves are the controls, instead of seventeen collapsible slider lists. It refuses the settings-form arrangement.

OWN-WORLD: Game palette on Monique anatomy. Console-grey slate panels with floor-black wells, UV-violet mono tracked section labels, arc knobs with a Strobe Blue arc for base-design values and a Hype Amber arc/handle for this weapon's roll and overrides, a smoke-grey tick at the saved value, small square latch buttons, tabular mono readouts, curve screens in floor black with a blue trace and an amber handle.

STORY: Pick an instrument in the rack strip, see its envelope, filter and LFO drawn, drag a curve or a knob, hear it at once through the real voices, fire it in the field at dummies, and save to design.json.

FIRST VIEWPORT: Preset bar across the top (weapon name and seed with prev/next, Roll, pins, key, section, drums, meter, unsaved count, Save/Revert/Base/Export/Import). Rack strip under it. Left about 70%: the active instrument panel in Monique rows (osc | filter curve | envelope curve | LFO curve, then Sub/Stack/Growl/Click layer rows, then the 16-step riff row). Right about 30%: the field window (player plus three dummies, about 4:3) with the fire latch, and the output strip under it. The primary action is firing in the field.

FORM: seed: none (pinned) - "I want it to resemble the Monique bass synth UI", "add a small window with the player on an open field where we can fire the weapon that we're tweaking in the same way as we do in the game", "I want curves and waves visualised like in the second image" (Softube Monoment Bass). Signature interaction: the filter graph draws the design's cutoff/resonance range as a band, with the weapon's roll as a draggable amber handle; band edges edit the design and the handle overrides the weapon.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
