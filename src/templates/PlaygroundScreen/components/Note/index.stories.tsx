import type { Meta, StoryObj } from '@storybook/react-vite';
import { Note } from '.';

const meta = {
  component: Note,
  args: { children: 'Note content' },
} satisfies Meta<typeof Note>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
