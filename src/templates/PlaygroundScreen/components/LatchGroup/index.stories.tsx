import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { LatchGroup } from '.';

const meta = {
  component: LatchGroup,
  args: {
    label: 'Fire',
    tone: 'weapon',
    options: [
      { value: 'off', label: 'Off', name: 'Fire off' },
      { value: 'hold', label: 'Hold', name: 'Hold fire' },
    ],
    value: 'off',
    onChange: fn(),
  },
} satisfies Meta<typeof LatchGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PickOne: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const group = canvas.getByRole('group', { name: 'Fire' });
    await expect(group).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Fire off' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Hold fire' }));
    await expect(args.onChange).toHaveBeenCalledWith('hold');
  },
};
