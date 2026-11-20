import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Toggle } from '.';

const meta = {
  component: Toggle,
  args: { label: 'Reduce flashing', checked: false, onChange: fn() },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Reduce flashing' });
    await expect(toggle).not.toBeChecked();
    await userEvent.click(canvas.getByText('Reduce flashing'));
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const On: Story = {
  args: { checked: true },
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Reduce flashing' });
    await expect(toggle).toBeChecked();
    toggle.focus();
    await userEvent.keyboard(' ');
    await expect(args.onChange).toHaveBeenCalledWith(false);
  },
};
