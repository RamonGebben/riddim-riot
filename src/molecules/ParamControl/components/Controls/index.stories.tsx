import type { Meta, StoryObj } from '@storybook/react-vite';
import { Controls } from '.';

const meta = {
  component: Controls,
  args: { children: 'Controls content' },
} satisfies Meta<typeof Controls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
