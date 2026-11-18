import type { Meta, StoryObj } from '@storybook/react-vite';
import { Lead } from '.';

const meta = {
  component: Lead,
  args: { children: 'Your build is the song.' },
} satisfies Meta<typeof Lead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
