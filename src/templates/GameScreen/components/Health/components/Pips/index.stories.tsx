import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pips } from '.';

const meta = {
  component: Pips,
  args: { children: '♥♥♥♡♡' },
} satisfies Meta<typeof Pips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
