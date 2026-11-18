import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { GameScreen } from '.';

const meta = {
  component: GameScreen,
  args: {
    seed: 42,
    bpm: 140,
    loadout: {
      slots: [
        { name: 'Vandal Wobble 1/8 Echo' },
        { name: 'Lumen Laser 1/16 Crush' },
        { name: 'Vandal Wobble 1/4' },
      ],
      active: 1,
    },
    onStop: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GameScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/mouse aim and fire/)).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};
