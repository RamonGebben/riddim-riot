import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combo } from '.';

const meta = {
  component: Combo,
  args: { children: '×4' },
} satisfies Meta<typeof Combo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
