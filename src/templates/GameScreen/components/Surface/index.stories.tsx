import type { Meta, StoryObj } from '@storybook/react-vite';
import { Surface } from '.';

const meta = {
  component: Surface,
  args: { children: 'Play area' },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
