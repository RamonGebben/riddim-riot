import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hint } from '.';

const meta = {
  component: Hint,
  args: {
    children: 'WASD to move · aim with the mouse · click or hold to fire',
  },
} satisfies Meta<typeof Hint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
