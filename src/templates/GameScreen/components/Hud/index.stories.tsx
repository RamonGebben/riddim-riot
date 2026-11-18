import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hud } from '.';

const meta = {
  component: Hud,
  args: { children: 'seed 42 · 140 BPM halftime' },
} satisfies Meta<typeof Hud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
