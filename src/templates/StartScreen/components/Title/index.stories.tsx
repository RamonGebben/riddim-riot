import type { Meta, StoryObj } from '@storybook/react-vite';
import { Title } from '.';

const meta = {
  component: Title,
  args: { children: 'Bass Weapons' },
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
