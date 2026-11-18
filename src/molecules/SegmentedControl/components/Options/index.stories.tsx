import type { Meta, StoryObj } from '@storybook/react-vite';
import { Options } from '.';

const meta = {
  component: Options,
  args: { children: 'Options content' },
} satisfies Meta<typeof Options>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
