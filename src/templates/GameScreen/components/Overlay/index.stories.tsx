import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Overlay } from '.';

const meta = {
  component: Overlay,
  args: {
    heading: 'Run over',
    stats: [
      { label: 'Level', value: '2/5' },
      { label: 'Kills', value: '31' },
      { label: 'Points', value: '4,650' },
      { label: 'Best', value: '5,000' },
    ],
    note: 'seed 2635956014',
    actions: [
      { label: 'Try again', onClick: fn() },
      { label: 'New run', onClick: fn() },
    ],
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RunOver: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Run over' }),
    ).toBeVisible();
    await expect(canvas.getByText('31')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }));
    await expect(args.actions[0].onClick).toHaveBeenCalled();
  },
};

export const LevelCleared: Story = {
  args: {
    heading: 'Level 1 cleared',
    stats: [
      { label: 'Kills', value: '24' },
      { label: 'Points', value: '3,120' },
    ],
    note: 'Level 2 of 5 is coming up',
    actions: [{ label: 'Next level', onClick: fn() }],
  },
};

export const NewBest: Story = {
  args: {
    badge: 'New best!',
    stats: [
      { label: 'Level', value: '1/5' },
      { label: 'Kills', value: '45' },
      { label: 'Points', value: '10,100' },
    ],
  },
};

export const Message: Story = {
  args: {
    heading: "Sound couldn't start",
    stats: undefined,
    message: ['The game runs on the music, so it waits for it.'],
  },
};
