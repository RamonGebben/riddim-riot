import type { Meta, StoryObj } from '@storybook/react-vite';
import { Backdrop } from '.';

const meta = {
  component: Backdrop,
  args: { children: 'Content' },
} satisfies Meta<typeof Backdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
