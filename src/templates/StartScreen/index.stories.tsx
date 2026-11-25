import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { StartScreen } from '.';

const meta = {
  component: StartScreen,
  args: {
    musicalKey: 'F minor',
    bpm: 140,
    subgenre: 'Riddim',
    levels: 5,
    best: 0,
    highScoresHref: '/leaderboard',
    weapons: [
      {
        name: 'Vandal Wobble 1/8 Echo',
        oscillator: 'wobble',
        lfo: '1/8',
        fx: 'echo',
        blasts: false,
      },
      {
        name: 'Lumen Laser 1/16',
        oscillator: 'laser',
        lfo: '1/16',
        fx: null,
        blasts: false,
      },
      {
        name: 'Vandal Beam 1/2 Crush',
        oscillator: 'beam',
        lfo: '1/2',
        fx: 'distortion',
        blasts: false,
      },
    ],
    flashingReduced: false,
    onFlashingReduced: fn(),
    isStarting: false,
    step: null,
    error: null,
    account: {
      kind: 'signedOut',
      isEntering: false,
      error: null,
      onEnter: fn(),
    },
    onStart: fn(),
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StartScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Drop in' }));
    await expect(args.onStart).toHaveBeenCalled();
  },
};

export const StartWithEnter: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.keyboard('{Enter}');
    await expect(args.onStart).toHaveBeenCalledTimes(1);
  },
};

export const ReadTheLoadout: Story = {
  play: async ({ canvas }) => {
    const loadout = canvas.getByRole('region', { name: 'Your loadout' });
    await expect(loadout).toHaveTextContent('Lumen Laser 1/16');
    await expect(loadout).toHaveTextContent('Rapid spray');
    await expect(loadout).toHaveTextContent(
      'Hold for a steady beam · hits burst and push back',
    );
  },
};

export const ReduceFlashing: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('switch', { name: 'Reduce flashing' }),
    );
    await expect(args.onFlashingReduced).toHaveBeenCalledWith(true);
  },
};

export const ReduceFlashingWithTheKeyboard: Story = {
  play: async ({ args, userEvent }) => {
    // Start first, then the switch, in tab order.
    await userEvent.tab();
    await userEvent.tab();
    // Enter flips the switch; it never starts the game.
    await userEvent.keyboard('{Enter}');
    await expect(args.onFlashingReduced).toHaveBeenCalledWith(true);
    await expect(args.onStart).not.toHaveBeenCalled();
  },
};

export const WithABest: Story = {
  args: { best: 12_300 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/best 12,300/)).toBeVisible();
  },
};

export const Starting: Story = {
  args: { isStarting: true, step: 'weapons' },
  play: async ({ args, canvas, userEvent }) => {
    // Busy, not disabled: it keeps the focus, and a second press does nothing.
    const button = canvas.getByRole('button', { name: 'Dropping in…' });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    await expect(args.onStart).not.toHaveBeenCalled();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Measuring your weapons…',
    );
  },
};

export const Failed: Story = {
  args: { error: 'AudioContext was not allowed to start' },
  play: async ({ args, canvas, userEvent }) => {
    const alert = canvas.getByRole('alert');
    await expect(alert).toHaveTextContent("Couldn't start the game.");
    await expect(alert).toHaveTextContent('Press Drop in to try again');
    await expect(alert).toHaveTextContent(
      'AudioContext was not allowed to start',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Drop in' }));
    await expect(args.onStart).toHaveBeenCalled();
  },
};

export const SignInBeforeARun: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Sign in to count every run' }),
    );
    await userEvent.type(canvas.getByLabelText(/Name/), 'riddim rat');
    await userEvent.type(canvas.getByLabelText(/Password/), 'correct horse');
    // Enter in the form signs in; it doesn't start the run.
    await userEvent.keyboard('{Enter}');
    await expect(
      args.account.kind === 'signedOut' && args.account.onEnter,
    ).toHaveBeenCalledWith({ name: 'RIDDIM_RAT', password: 'correct horse' });
    await expect(args.onStart).not.toHaveBeenCalled();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(
      canvas.getByRole('button', { name: 'Sign in to count every run' }),
    ).toBeVisible();
  },
};

export const SignedIn: Story = {
  args: {
    account: {
      kind: 'signedIn',
      name: 'RIDDIMRAT',
      isSigningOut: false,
      signOutFailed: false,
      onSignOut: fn(),
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('RIDDIMRAT')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out' }));
    await expect(
      args.account.kind === 'signedIn' && args.account.onSignOut,
    ).toHaveBeenCalled();
  },
};

export const SignOutFailed: Story = {
  args: {
    account: {
      kind: 'signedIn',
      name: 'RIDDIMRAT',
      isSigningOut: false,
      signOutFailed: true,
      onSignOut: fn(),
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: "Couldn't sign out, try again" }),
    ).toBeEnabled();
  },
};
