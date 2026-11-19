import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { HEART_ICON, WEAPON_ICONS } from '~/game/icons';
import { Icon } from '.';

const meta = {
  component: Icon,
  args: { icon: WEAPON_ICONS.wobble },
  decorators: [Story => <div style={{ fontSize: 48 }}>{Story()}</div>],
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  },
};

export const Labelled: Story = {
  args: { icon: HEART_ICON, label: 'Health' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Health' })).toBeVisible();
  },
};
