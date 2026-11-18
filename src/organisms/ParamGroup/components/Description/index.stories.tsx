import type { Meta, StoryObj } from '@storybook/react-vite';
import { Description } from '.';

const meta = {
  component: Description,
  args: { children: 'Description content' },
} satisfies Meta<typeof Description>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
