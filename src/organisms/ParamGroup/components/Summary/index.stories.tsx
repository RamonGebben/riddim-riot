import type { Meta, StoryObj } from '@storybook/react-vite';
import { Summary } from '.';

const meta = {
  component: Summary,
  args: { children: 'Summary content' },
} satisfies Meta<typeof Summary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
