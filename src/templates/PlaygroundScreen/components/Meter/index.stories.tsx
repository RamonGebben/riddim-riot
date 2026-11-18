import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from '.';

const meta = {
  component: Meter,
  args: { read: () => -12 },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loud: Story = {};

export const Quiet: Story = { args: { read: () => -48 } };
