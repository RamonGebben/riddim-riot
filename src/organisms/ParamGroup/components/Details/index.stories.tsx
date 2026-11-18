import type { Meta, StoryObj } from '@storybook/react-vite';
import { Details } from '.';

const meta = {
  component: Details,
  args: { children: 'Details content' },
} satisfies Meta<typeof Details>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
