import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Loadout } from '.';

const meta = {
  component: Loadout,
  args: {
    slots: [
      { name: 'Vandal Wobble 1/8 Echo' },
      { name: 'Lumen Laser 1/16 Crush' },
      { name: 'Vandal Wobble 1/4' },
    ],
    active: 0,
  },
} satisfies Meta<typeof Loadout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstSlot: Story = {
  play: async ({ canvas }) => {
    const items = canvas.getAllByRole('listitem');
    await expect(items).toHaveLength(3);
    await expect(items[0]).toHaveAttribute('aria-current', 'true');
  },
};

export const ThirdSlot: Story = { args: { active: 2 } };
