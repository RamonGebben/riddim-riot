import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Knob } from '.';

const meta = {
  component: Knob,
  args: {
    label: 'Cutoff',
    hint: 'Where the sweep tops out',
    value: 1000,
    reference: 1000,
    min: 200,
    max: 12000,
    step: 10,
    unit: 'Hz',
    onChange: fn(),
    onReset: fn(),
  },
} satisfies Meta<typeof Knob>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Design: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const knob = canvas.getByRole('slider', { name: 'Cutoff' });
    await expect(knob).toHaveAttribute('aria-valuetext', '1.00k');
    knob.focus();
    await userEvent.keyboard('{ArrowUp}');
    // A hundredth of the way round, on a log scale: about 4%.
    await expect(args.onChange).toHaveBeenCalledWith(1040);
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await expect(args.onChange).toHaveBeenLastCalledWith(990);
    await userEvent.keyboard('{End}');
    await expect(args.onChange).toHaveBeenLastCalledWith(12000);
  },
};

export const Moved: Story = {
  args: { value: 2400, tone: 'weapon' },
  play: async ({ args, canvas, userEvent }) => {
    const knob = canvas.getByRole('slider', { name: 'Cutoff' });
    await userEvent.dblClick(knob);
    await expect(args.onReset).toHaveBeenCalled();
  },
};

export const TypeAValue: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /^Cutoff value/ }),
    );
    const entry = canvas.getByRole('textbox', { name: 'Cutoff value' });
    await userEvent.clear(entry);
    await userEvent.type(entry, '99999{Enter}');
    // Kept inside the range.
    await expect(args.onChange).toHaveBeenCalledWith(12000);
  },
};
