import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Header } from '.';

const meta = {
  component: Header,
  args: {
    unsaved: true,
    message: null,
    onSave: fn(),
    onExport: fn(),
    onImport: fn(),
    onRevert: fn(),
    onBase: fn(),
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unsaved: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Unsaved changes',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Save to game' }));
    await expect(args.onSave).toHaveBeenCalled();
  },
};

export const Saved: Story = {
  args: { unsaved: false, message: 'Saved to src/game/sound/design.json' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Save to game' }),
    ).toBeDisabled();
  },
};
