import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { F_MINOR } from '~/game/music';
import { BASE_DESIGN } from '~/game/sound';
import { allSections } from '~/game/sound/racks';
import { withValue } from '~/game/sound/schema';
import { rollWeapon } from '~/game/weapons';
import { SectionWell } from '.';

const weapon = rollWeapon(42, F_MINOR, { pins: { oscillator: 'wobble' } });
const section = (id: string) => {
  const found = allSections().find(candidate => candidate.id === id);
  if (!found) throw new Error(id);
  return found;
};

const meta = {
  component: SectionWell,
  args: {
    section: section('blast'),
    riff: null,
    onTrigger: fn(),
    tuning: {
      design: withValue(BASE_DESIGN, ['blast', 'boomDecay'], 0.9),
      saved: BASE_DESIGN,
      set: fn(),
      weapon: {
        sound: weapon.sound,
        rolled: weapon.sound,
        overrides: {},
        override: fn(),
      },
    },
  },
} satisfies Meta<typeof SectionWell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlayAndReset: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Play Crush blast' }),
    );
    await expect(args.onTrigger).toHaveBeenCalledWith('blast');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset Crush blast' }),
    );
    await expect(args.tuning.set).toHaveBeenCalledWith(
      ['blast', 'boomDecay'],
      BASE_DESIGN.blast.boomDecay,
    );
  },
};

export const WithTheWeaponsKnobs: Story = {
  args: { section: section('wobble.filter') },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('group', { name: 'This weapon' }),
    ).toBeVisible();
    await expect(canvas.getByRole('slider', { name: 'Cutoff' })).toBeVisible();
  },
};
