import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn } from 'storybook/test';
import { ParamControl, type ParamControlProps } from '.';

/** Holds the value like the playground does, so typing behaves for real. */
const Stateful = (props: ParamControlProps) => {
  const [value, setValue] = useState(props.value);
  return (
    <ParamControl
      {...props}
      value={value}
      onChange={next => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
};

const meta = {
  component: ParamControl,
  args: {
    field: {
      kind: 'number',
      path: ['drums', 'kick', 'decay'],
      label: 'Kick decay',
      min: 0.05,
      max: 2,
      step: 0.01,
      unit: 's',
      hint: 'How long the kick rings',
    },
    value: 0.45,
    changed: false,
    onChange: fn(),
  },
  render: args => <Stateful {...args} />,
} satisfies Meta<typeof ParamControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Number: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const box = canvas.getByRole('spinbutton', { name: 'Kick decay value' });
    await userEvent.clear(box);
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.type(box, '0.9');
    await expect(args.onChange).toHaveBeenLastCalledWith(0.9);
  },
};

export const Changed: Story = { args: { changed: true } };

export const Choice: Story = {
  args: {
    field: {
      kind: 'choice',
      path: ['wobble', 'rolloff'],
      label: 'Filter slope',
      options: [-12, -24, -48],
    },
    value: -24,
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText('Filter slope'), '-48');
    await expect(args.onChange).toHaveBeenCalledWith(-48);
  },
};

export const Degrees: Story = {
  args: {
    field: {
      kind: 'degrees',
      path: ['parts', 'engines', 'wobble', 'degrees'],
      label: 'Wobble riff degrees',
    },
    value: [0, 0, 2, 3, 4, 6],
  },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByLabelText('Wobble riff degrees');
    await userEvent.clear(input);
    await userEvent.type(input, '0, 7');
    await expect(args.onChange).toHaveBeenLastCalledWith([0, 7]);
  },
};
