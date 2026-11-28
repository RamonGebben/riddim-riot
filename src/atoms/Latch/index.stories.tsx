import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Latch } from '.';

const meta = {
  component: Latch,
  args: { children: 'Hold', onClick: fn(), type: 'button' },
} satisfies Meta<typeof Latch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: { 'aria-pressed': false },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Hold' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

export const OnForTheDesign: Story = { args: { 'aria-pressed': true } };

export const OnForTheWeapon: Story = {
  args: { 'aria-pressed': true, $tone: 'weapon' },
};
