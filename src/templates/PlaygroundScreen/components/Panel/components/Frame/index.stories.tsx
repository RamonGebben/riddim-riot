import type { Meta, StoryObj } from '@storybook/react-vite';
import { Frame } from '.';

const meta = {
  component: Frame,
  args: { children: 'Content' },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
