import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bar } from '.';

const meta = {
  component: Bar,
  args: { children: 'Content' },
} satisfies Meta<typeof Bar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
