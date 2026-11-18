import type { Meta, StoryObj } from '@storybook/react-vite';
import { List } from '.';

const meta = {
  component: List,
  args: { children: 'Vandal Wobble 1/8 Echo' },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
