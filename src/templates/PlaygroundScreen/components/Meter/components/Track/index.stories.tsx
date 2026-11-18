import type { Meta, StoryObj } from '@storybook/react-vite';
import { Track } from '.';

const meta = {
  component: Track,
  args: { children: null },
} satisfies Meta<typeof Track>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
