import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from '.';

const meta = {
  component: Label,
  args: { children: 'Label content' },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
