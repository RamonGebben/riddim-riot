import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stack } from '.';

const meta = {
  component: Stack,
  args: { children: 'Stack content' },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
