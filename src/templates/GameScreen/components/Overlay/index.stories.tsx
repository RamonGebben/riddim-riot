import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Overlay } from '.';

const meta = {
  component: Overlay,
  args: {
    heading: 'Run over',
    stats: ['Level 2', '31 kills'],
    actions: [
      { label: 'Try again', onClick: fn() },
      { label: 'New run', onClick: fn() },
    ],
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunOver: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Run over' }),
    ).toBeVisible();
    await expect(canvas.getByText('31 kills')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.actions[0].onClick).toHaveBeenCalled();
  },
};

export const LevelCleared: Story = {
  args: {
    heading: 'Level 1 cleared',
    stats: ['3 waves', '24 kills'],
    actions: [{ label: 'Next level', onClick: fn() }],
  },
};
