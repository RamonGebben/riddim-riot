import type { Meta, StoryObj } from '@storybook/react-vite';
import { RangeInput } from '.';

const meta = {
  component: RangeInput,
  args: { min: 0, max: 100, defaultValue: 40, 'aria-label': 'Cutoff' },
} satisfies Meta<typeof RangeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
