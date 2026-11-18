import type { Meta, StoryObj } from '@storybook/react-vite';
import { Panel } from '.';

const meta = {
  component: Panel,
  args: { children: 'Panel content' },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
