import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextInput } from '.';

const meta = {
  component: TextInput,
  args: { defaultValue: '0, 2, 3, 4', 'aria-label': 'Degrees' },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { $invalid: true, defaultValue: '0, x' },
};

export const Password: Story = {
  args: { type: 'password', defaultValue: 'secret', 'aria-label': 'Password' },
};
