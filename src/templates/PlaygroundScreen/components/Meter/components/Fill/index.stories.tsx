import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fill } from '.';

const meta = {
  component: Fill,
  args: { children: null },
} satisfies Meta<typeof Fill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
