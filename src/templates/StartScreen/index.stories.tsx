import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { StartScreen } from '.';

const meta = {
  component: StartScreen,
  args: {
    status: 'idle',
    seed: 42,
    bpm: 140,
    onStart: fn(),
    onStop: fn(),
  },
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['idle', 'starting', 'playing'],
    },
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
  args: { status: 'starting' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Press to start' }),
    ).toBeDisabled();
  },
};

export const Playing: Story = {
  args: { status: 'playing' },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Stop' }));
    await expect(args.onStop).toHaveBeenCalled();
  },
};
