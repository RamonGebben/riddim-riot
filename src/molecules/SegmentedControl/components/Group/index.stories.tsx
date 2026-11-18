import type { Meta, StoryObj } from '@storybook/react-vite';
import { Group } from '.';

const meta = {
  component: Group,
  args: { children: 'Group content' },
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
