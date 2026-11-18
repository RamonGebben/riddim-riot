import type { Meta, StoryObj } from '@storybook/react-vite';
import { Columns } from '.';

const meta = {
  component: Columns,
  args: { children: 'Columns content' },
} satisfies Meta<typeof Columns>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
