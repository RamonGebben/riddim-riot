import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { StartScreen } from '.';

const meta = {
  component: StartScreen,
  args: {
    musicalKey: 'F minor',
    bpm: 140,
    levels: 5,
    best: 0,
    seed: '42',
    weapons: [
      {
        name: 'Vandal Wobble 1/8 Echo',
        oscillator: 'wobble',
        lfo: '1/8',
        fx: 'echo',
        blasts: false,
      },
      {
        name: 'Lumen Laser 1/16',
        oscillator: 'laser',
        lfo: '1/16',
        fx: null,
        blasts: false,
      },
      {
        name: 'Vandal Beam 1/2 Crush',
        oscillator: 'beam',
        lfo: '1/2',
        fx: 'distortion',
        blasts: false,
      },
    ],
    onSeed: fn(),
    onRollSeed: fn(),
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

export const PickASeed: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Seed' }), 'x');
    await expect(args.onSeed).toHaveBeenCalledWith('42x');
    await userEvent.click(canvas.getByRole('button', { name: 'Roll' }));
    await expect(args.onRollSeed).toHaveBeenCalled();
    await expect(
      canvas.getByRole('region', { name: 'Your loadout' }),
    ).toHaveTextContent('Laser 1/16');
  },
};

export const WithABest: Story = {
  args: { best: 12_300 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/best 12,300/)).toBeVisible();
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
