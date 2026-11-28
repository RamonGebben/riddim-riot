import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { STEPS_PER_DIVISION } from '~/game/grid';
import { F_MINOR } from '~/game/music';
import { BASE_DESIGN } from '~/game/sound';
import { withValue } from '~/game/sound/schema';
import { rollWeapon } from '~/game/weapons';
import { PlaygroundScreen } from '.';

const weapon = rollWeapon(42, F_MINOR, { pins: { oscillator: 'wobble' } });

const meta = {
  component: PlaygroundScreen,
  args: {
    status: 'ready',
    onStart: fn(),
    mountRange: null,
    file: {
      message: null,
      onSave: fn(),
      onExport: fn(),
      onImport: fn(),
      onRevert: fn(),
      onBase: fn(),
    },
    design: {
      current: withValue(BASE_DESIGN, ['wobble', 'voices'], 5),
      saved: BASE_DESIGN,
      onChange: fn(),
    },
    track: {
      root: 5,
      scale: 'minor',
      onKey: fn(),
      drums: true,
      onDrums: fn(),
      section: 'groove',
      onSection: fn(),
      onOneShot: fn(),
      readLevel: () => -14,
    },
    weapon: {
      name: weapon.name,
      seed: 42,
      gainDb: -14.4,
      pins: { oscillator: 'wobble' },
      onPins: fn(),
      onSeed: fn(),
      onRoll: fn(),
      sound: { ...weapon.sound, cutoff: 1800 },
      rolled: weapon.sound,
      overrides: { cutoff: 1800 },
      onOverride: fn(),
      riff: {
        notes: weapon.sound.riff,
        every: STEPS_PER_DIVISION[weapon.timing.division],
      },
      readRiffNote: () => 1,
      rolls: [1, 2, 3, 4].map(seed => ({
        seed,
        name: rollWeapon(seed, F_MINOR).name,
      })),
      onRollMany: fn(),
      fire: 'hold',
      onFire: fn(),
      onTap: fn(),
    },
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PlaygroundScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wobble: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('1 unsaved')).toBeVisible();
    const voices = canvas.getByRole('slider', { name: 'Voices' });
    await expect(voices).toHaveAttribute('aria-valuenow', '5');
    voices.focus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(args.design.onChange).toHaveBeenCalledWith(
      ['wobble', 'voices'],
      6,
    );
    await userEvent.keyboard('{Delete}');
    await expect(args.design.onChange).toHaveBeenLastCalledWith(
      ['wobble', 'voices'],
      BASE_DESIGN.wobble.voices,
    );
    // The weapon's own cutoff, overridden: amber, and back to the roll.
    const cutoff = canvas.getByRole('slider', { name: 'Cutoff' });
    await expect(cutoff).toHaveAttribute('aria-valuenow', '1800');
    cutoff.focus();
    await userEvent.keyboard('{Delete}');
    await expect(args.weapon.onOverride).toHaveBeenCalledWith(
      'cutoff',
      undefined,
    );
  },
};

export const TypeAValue: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /^Spread value/ }),
    );
    const entry = canvas.getByRole('textbox', { name: 'Spread value' });
    await userEvent.clear(entry);
    await userEvent.type(entry, '33{Enter}');
    await expect(args.design.onChange).toHaveBeenCalledWith(
      ['wobble', 'spread'],
      33,
    );
  },
};

export const Hits: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Hits' }));
    await expect(canvas.getByRole('tab', { name: 'Hits' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Play Crush blast' }),
    );
    await expect(args.track.onOneShot).toHaveBeenCalledWith('blast');
  },
};

export const AnotherEngine: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Laser' }));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Audition a laser' }),
    );
    await expect(args.weapon.onPins).toHaveBeenCalledWith({
      oscillator: 'laser',
    });
  },
};

export const BeforeAudio: Story = {
  args: { status: 'idle' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Start audio' }));
    await expect(args.onStart).toHaveBeenCalled();
  },
};
