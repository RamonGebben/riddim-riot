import type { Meta as StoryMeta, StoryObj } from '@storybook/react-vite';
import { Meta } from '.';

const meta = {
  component: Meta,
  args: { children: 'seed 42 · F minor · 140 BPM halftime' },
} satisfies StoryMeta<typeof Meta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
