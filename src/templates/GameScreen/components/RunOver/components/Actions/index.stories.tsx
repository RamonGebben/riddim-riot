import type { Meta, StoryObj } from '@storybook/react-vite';
import { Actions } from '.';

const meta = {
  component: Actions,
  args: { children: 'Buttons go here' },
} satisfies Meta<typeof Actions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
