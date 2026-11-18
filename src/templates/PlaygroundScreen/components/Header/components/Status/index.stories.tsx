import type { Meta, StoryObj } from '@storybook/react-vite';
import { Status } from '.';

const meta = {
  component: Status,
  args: { children: 'Unsaved changes' },
} satisfies Meta<typeof Status>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
