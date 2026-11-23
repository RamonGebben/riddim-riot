import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Powerups } from '.';

const meta = {
  component: Powerups,
  args: { pellet: 6, halfTime: null, chord: 3 },
} satisfies Meta<typeof Powerups>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('Pellet, 6 s left')).toBeVisible();
    await expect(canvas.getByLabelText('Chord, 3 s left')).toBeVisible();
    await expect(canvas.queryByLabelText(/Half-time/)).toBeNull();
  },
};

export const None: Story = {
  args: { pellet: null, chord: null },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('list')).toBeNull();
  },
};
