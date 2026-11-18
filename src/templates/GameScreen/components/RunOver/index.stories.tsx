import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { RunOver } from '.';

const meta = {
  component: RunOver,
  args: { kills: 12, onRetry: fn(), onNewRun: fn() },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof RunOver>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Run over' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.onRetry).toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'New run' }));
    await expect(args.onNewRun).toHaveBeenCalled();
  },
};
