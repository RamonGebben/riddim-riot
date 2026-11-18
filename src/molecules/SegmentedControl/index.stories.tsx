import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { SegmentedControl } from '.';

const meta = {
  component: SegmentedControl,
  args: {
    label: 'Fire',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'hold', label: 'Hold' },
      { value: 'mash', label: 'Mash' },
    ],
    value: 'off',
    onChange: fn(),
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('button', { name: 'Off' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Hold' }));
    await expect(args.onChange).toHaveBeenCalledWith('hold');
  },
};
