import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hint } from '.';

const meta = {
  component: Hint,
  args: {
    children:
      'WASD move · mouse aim and fire · 1-3, Q/E or wheel switch · F take weapon',
  },
} satisfies Meta<typeof Hint>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
