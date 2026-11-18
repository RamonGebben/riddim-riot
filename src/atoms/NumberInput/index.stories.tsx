import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberInput } from '.';

const meta = {
  component: NumberInput,
  args: { defaultValue: 0.45, step: 0.01, 'aria-label': 'Decay' },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
