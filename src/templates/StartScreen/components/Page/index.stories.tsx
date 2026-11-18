import type { Meta, StoryObj } from '@storybook/react-vite';
import { Page } from '.';

const meta = {
  component: Page,
  args: { children: 'Content' },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
