import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { WeaponTag } from '.';

const meta = {
  component: WeaponTag,
  args: {
    name: 'Vandal Wobble 1/4 Crush',
    oscillator: 'wobble',
    lfo: '1/4',
    fx: 'distortion',
    blasts: true,
  },
} satisfies Meta<typeof WeaponTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SlowAndCrushed: Story = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('Wobble 1/4blastCrush');
  },
};
