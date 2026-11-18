import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prompt } from '.';

const meta = {
  component: Prompt,
  args: {
    children: (
      <>
        <kbd>F</kbd> take Vandal Laser 1/8 Echo
      </>
    ),
  },
} satisfies Meta<typeof Prompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
