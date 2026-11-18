import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { F_MINOR } from '~/game/music';
import { BASE_DESIGN } from '~/game/sound';
import { withValue } from '~/game/sound/schema';
import { rollWeapon } from '~/game/weapons';
import { PlaygroundScreen } from '.';

const weapon = rollWeapon(42, F_MINOR);

const meta = {
  component: PlaygroundScreen,
  args: {
    status: 'ready',
    onStart: fn(),
    file: {
      unsaved: true,
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
      onResetGroup: fn(),
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
      pins: {},
      onPins: fn(),
      onSeed: fn(),
      onRoll: fn(),
      rolled: weapon.sound,
      overrides: {},
      onOverride: fn(),
      onClearOverrides: fn(),
      fire: 'hold',
      onFire: fn(),
      onTap: fn(),
    },
    compare: {
      rolls: [1, 2, 3, 4].map(seed => ({
        seed,
        name: rollWeapon(seed, F_MINOR).name,
      })),
      onRollMany: fn(),
    },
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PlaygroundScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tuning: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('1 changed')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Drop hit' }));
    await expect(args.track.onOneShot).toHaveBeenCalledWith('drop');
    await userEvent.click(canvas.getByRole('button', { name: 'Laser' }));
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
