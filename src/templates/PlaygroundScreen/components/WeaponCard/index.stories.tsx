import type { Meta, StoryObj } from '@storybook/react-vite';
import { WeaponCard } from '.';

const meta = {
  component: WeaponCard,
  args: { name: 'Lumen Wobble 1/8 Echo', seed: 42, gainDb: -12.4 },
} satisfies Meta<typeof WeaponCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Armed: Story = {};

export const Arming: Story = { args: { gainDb: null } };
