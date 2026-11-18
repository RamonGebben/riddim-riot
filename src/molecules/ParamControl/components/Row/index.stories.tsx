import type { Meta, StoryObj } from '@storybook/react-vite';
import { Row } from '.';

const meta = {
  component: Row,
  args: { $changed: true, children: 'Kick decay' },
} satisfies Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
