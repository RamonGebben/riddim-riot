import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fields } from '.';

const meta = {
  component: Fields,
  args: { children: 'Fields content' },
} satisfies Meta<typeof Fields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
