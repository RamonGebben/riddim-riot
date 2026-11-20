import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextLink } from '.';

const meta = {
  component: TextLink,
  args: { href: '#', children: 'High scores' },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
