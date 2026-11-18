import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Health } from '.';

const meta = {
  component: Health,
  args: { hp: 3, maxHp: 5 },
} satisfies Meta<typeof Health>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hurt: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('img', { name: 'Health 3 of 5' }),
    ).toBeVisible();
  },
};

export const Full: Story = { args: { hp: 5 } };
