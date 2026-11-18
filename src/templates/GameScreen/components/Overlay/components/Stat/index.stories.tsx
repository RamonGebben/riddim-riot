import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stat } from '.';

const meta = {
  component: Stat,
  args: { children: '12 kills' },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
