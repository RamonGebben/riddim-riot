import type { Meta, StoryObj } from '@storybook/react-vite';
import { Key } from '.';

const meta = {
  component: Key,
  args: { children: '1' },
} satisfies Meta<typeof Key>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
