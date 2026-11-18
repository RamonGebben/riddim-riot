import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '.';

const meta = {
  component: Heading,
  args: { children: 'Weapon' },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
