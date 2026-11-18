import type { Meta, StoryObj } from '@storybook/react-vite';
import { Buttons } from '.';

const meta = {
  component: Buttons,
  args: { children: 'Buttons content' },
} satisfies Meta<typeof Buttons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
