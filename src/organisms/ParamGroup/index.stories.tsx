import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { BASE_DESIGN } from '~/game/sound';
import { DESIGN_SCHEMA, withValue } from '~/game/sound/schema';
import { ParamGroup } from '.';

const drums = DESIGN_SCHEMA.find(group => group.id === 'drums')!;

const meta = {
  component: ParamGroup,
  args: {
    group: drums,
    design: BASE_DESIGN,
    saved: BASE_DESIGN,
    open: true,
    onChange: fn(),
    onReset: fn(),
  },
} satisfies Meta<typeof ParamGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Saved: Story = {};

export const WithChanges: Story = {
  args: {
    design: withValue(
      withValue(BASE_DESIGN, ['drums', 'kick', 'decay'], 0.9),
      ['drums', 'level'],
      -2,
    ),
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('2 changed')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Reset drums' }));
    await expect(args.onReset).toHaveBeenCalled();
  },
};
