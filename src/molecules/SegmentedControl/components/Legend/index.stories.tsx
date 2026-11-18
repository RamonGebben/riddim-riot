import type { Meta, StoryObj } from '@storybook/react-vite';
import { Legend } from '.';

const meta = {
  component: Legend,
  args: { children: 'Legend content' },
} satisfies Meta<typeof Legend>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
