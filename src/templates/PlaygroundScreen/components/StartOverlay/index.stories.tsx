import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { StartOverlay } from '.';

const meta = {
  component: StartOverlay,
  args: { isStarting: false, onStart: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StartOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Start audio' }));
    await expect(args.onStart).toHaveBeenCalled();
  },
};
