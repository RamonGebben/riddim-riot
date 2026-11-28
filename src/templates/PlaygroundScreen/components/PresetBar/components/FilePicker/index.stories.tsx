import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePicker } from '.';

const meta = {
  component: FilePicker,
  args: { children: 'Import' },
} satisfies Meta<typeof FilePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
