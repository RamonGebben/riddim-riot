import type { Meta, StoryObj } from '@storybook/react-vite';
import { Name } from '.';

const meta = {
  component: Name,
  args: { children: 'Lumen Wobble 1/8 Echo' },
} satisfies Meta<typeof Name>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
