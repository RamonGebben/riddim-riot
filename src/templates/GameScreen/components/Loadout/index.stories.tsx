import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Loadout, type SlotProps } from '.';

const slot = (overrides: Partial<SlotProps>): SlotProps => ({
  name: 'Vandal Wobble 1/8 Echo',
  oscillator: 'wobble',
  lfo: '1/8',
  fx: 'echo',
  blasts: false,
  ammo: 8,
  magazine: 8,
  reload: null,
  ...overrides,
});

const meta = {
  component: Loadout,
  args: {
    slots: [
      slot({}),
      slot({
        name: 'Lumen Laser 1/16 Crush',
        oscillator: 'laser',
        lfo: '1/16',
        fx: 'distortion',
        ammo: 0,
        magazine: 16,
        reload: { id: 1, seconds: 0.9 },
      }),
      slot({
        name: 'Vandal Beam 1/2',
        oscillator: 'beam',
        lfo: '1/2',
        fx: null,
        ammo: 11,
        magazine: 16,
      }),
    ],
    active: 0,
    onFire: fn(),
    onRelease: fn(),
  },
} satisfies Meta<typeof Loadout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstSlot: Story = {
  play: async ({ canvas }) => {
    const slots = canvas.getAllByRole('button');
    await expect(slots).toHaveLength(3);
    await expect(slots[0]).toHaveAttribute('aria-pressed', 'true');
    await expect(slots[1]).toHaveAccessibleName(
      'Lumen Laser 1/16 Crush, 0 of 16',
    );
  },
};

export const ThirdSlot: Story = { args: { active: 2 } };
