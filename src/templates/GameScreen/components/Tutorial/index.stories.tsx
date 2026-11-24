import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect } from 'storybook/test';
import { Tutorial, type TutorialSignals } from '.';

const START: TutorialSignals = {
  moving: false,
  dashKey: 0,
  active: 0,
  ammo: 8,
  menuOpen: false,
  paused: false,
};

/** Buttons standing in for the game, to drive the signals it would send. */
const WithFakeGame = () => {
  const [signals, setSignals] = useState(START);
  const act = (label: string, change: Partial<TutorialSignals>) => (
    <button
      type="button"
      onClick={() => setSignals(current => ({ ...current, ...change }))}
    >
      {label}
    </button>
  );
  return (
    <>
      {act('Walk', { moving: true })}
      {act('Stop', { moving: false })}
      {act('Fire', { ammo: signals.ammo - 1 })}
      {act('Dash', { dashKey: signals.dashKey + 1 })}
      {act('Switch', { active: (signals.active + 1) % 3, ammo: 4 })}
      {act('Open bag', { menuOpen: true })}
      {act('Close bag', { menuOpen: false })}
      {act('Pause', { paused: true })}
      {act('Resume', { paused: false })}
      <Tutorial signals={signals} hidden={signals.menuOpen || signals.paused} />
    </>
  );
};

const meta = {
  component: Tutorial,
  args: { signals: START },
} satisfies Meta<typeof Tutorial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {};

export const StepsOnAsThePlayerDoesEach: Story = {
  render: () => <WithFakeGame />,
  play: async ({ canvas, userEvent }) => {
    const press = (name: string) =>
      userEvent.click(canvas.getByRole('button', { name }));
    const stepUp = (name: string) =>
      expect(
        canvas.findByRole('region', { name }, { timeout: 3000 }),
      ).resolves.toBeVisible();

    await expect(canvas.getByRole('region', { name: 'Move' })).toBeVisible();
    // Firing first doesn't count: each step waits for its own control.
    await press('Fire');
    await expect(canvas.getByRole('region', { name: 'Move' })).toBeVisible();
    await press('Walk');
    await expect(canvas.getByRole('img', { name: 'Done' })).toBeVisible();
    await stepUp('Aim and fire');
    await press('Stop');
    await press('Fire');
    await stepUp('Dash');
    await press('Dash');
    await stepUp('Switch weapons');
    await press('Switch');
    await stepUp('Loot and your bag');
    await press('Open bag');
    await press('Close bag');
    await stepUp('Health and pause');
    await press('Pause');
    // Hidden behind the pause, it steps on all the same.
    await press('Resume');
    await stepUp('Ready');
    await expect(
      canvas.getByRole('region', { name: 'Ready' }),
    ).toHaveTextContent(
      'Now stand in the circle until it fills to start your run.',
    );
    // The last card keeps the powerups up, each named beside its icon.
    const legend = canvas.getByRole('list', { name: 'Powerups' });
    await expect(legend).toHaveTextContent('Pellet');
    await expect(legend).toHaveTextContent('Half-time');
    await expect(legend).toHaveTextContent('Chord');
  },
};
