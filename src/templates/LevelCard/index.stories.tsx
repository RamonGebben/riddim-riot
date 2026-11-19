import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { LevelCard } from '.';

const meta = {
  component: LevelCard,
  args: { level: 2, levels: 5, musicalKey: 'G minor' },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LevelCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NextLevel: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('Level 2 of 5');
    await expect(
      canvas.getByRole('heading', { name: 'G minor' }),
    ).toBeVisible();
  },
};

export const FinalLevel: Story = {
  args: { level: 5 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Final level' }),
    ).toBeVisible();
  },
};
