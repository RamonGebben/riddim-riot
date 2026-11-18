import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { GameScreen } from '.';

const meta = {
  component: GameScreen,
  args: {
    seed: 42,
    musicalKey: 'F minor',
    bpm: 140,
    loadout: {
      slots: [
        { name: 'Vandal Wobble 1/8 Echo' },
        { name: 'Lumen Laser 1/16 Crush' },
        { name: 'Vandal Wobble 1/4' },
      ],
      active: 1,
    },
    run: { status: 'playing', hp: 4, maxHp: 5, kills: 12 },
    onStop: fn(),
    onRetry: fn(),
    onNewRun: fn(),
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

export const RunEnded: Story = {
  args: { run: { status: 'dead', hp: 0, maxHp: 5, kills: 31 } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('31 kills', { selector: 'p' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};
