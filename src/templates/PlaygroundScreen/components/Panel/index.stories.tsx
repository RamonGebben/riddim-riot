import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from '.';

const meta = {
  component: Panel,
  args: { title: 'Track', children: 'Controls go here' },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
