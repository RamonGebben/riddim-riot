import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { StartScreen } from '.';

const meta = {
  component: StartScreen,
  args: {
    seed: 42,
    musicalKey: 'F minor',
    bpm: 140,
    isStarting: false,
    onStart: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Press to start' }),
    );
    await expect(args.onStart).toHaveBeenCalled();
  },
};

export const Starting: Story = {
  args: { isStarting: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Press to start' }),
    ).toBeDisabled();
  },
};
