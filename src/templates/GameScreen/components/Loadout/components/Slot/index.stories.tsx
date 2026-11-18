import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slot } from '.';

const meta = {
  component: Slot,
  args: { children: 'Lumen Laser 1/16 Crush', $active: false },
} satisfies Meta<typeof Slot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Holstered: Story = {};

export const Active: Story = { args: { $active: true } };
