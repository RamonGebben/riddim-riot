import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '.';

const meta = {
  component: Select,
  args: {
    'aria-label': 'Waveform',
    defaultValue: 'sawtooth',
    children: (
      <>
        <option value="sawtooth">sawtooth</option>
        <option value="square">square</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
