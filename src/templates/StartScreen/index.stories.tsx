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
    step: null,
    error: null,
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
  args: { isStarting: true, step: 'weapons' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Press to start' }),
    ).toBeDisabled();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Measuring your weapons…',
    );
  },
};

export const Failed: Story = {
  args: { error: 'AudioContext was not allowed to start' },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      "Couldn't start: AudioContext was not allowed to start",
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Press to start' }),
    );
    await expect(args.onStart).toHaveBeenCalled();
  },
};
