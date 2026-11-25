import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { PlayerCard } from '.';

const PLAYER = {
  name: 'RIDDIMRAT',
  rank: 2,
  runsCount: 174,
  bestScore: 41_200,
};

const meta = {
  component: PlayerCard,
  args: {
    kind: 'signedOut',
    isEntering: false,
    error: null,
    onEnter: fn(),
    recover: { isRecovering: false, error: null, onRecover: fn() },
  },
} satisfies Meta<typeof PlayerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Name/), 'sublo');
    await userEvent.type(canvas.getByLabelText(/Password/), 'correct horse');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(
      args.kind === 'signedOut' && args.onEnter,
    ).toHaveBeenCalledWith({ name: 'SUBLO', password: 'correct horse' });
  },
};

export const ForgotPassword: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Forgot your password?' }),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Reset your password' }),
    ).toBeVisible();
    // Checked before it's sent: a code is 16 letters and digits.
    await userEvent.type(canvas.getByLabelText(/Name/), 'sublo');
    await userEvent.type(canvas.getByLabelText(/Recovery code/), 'k7qm-2xrp');
    await userEvent.type(canvas.getByLabelText(/New password/), 'a new one!');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset password' }),
    );
    await expect(canvas.getByText(/16 letters and digits/)).toBeVisible();
    const recover = args.kind === 'signedOut' ? args.recover : null;
    await expect(recover?.onRecover).not.toHaveBeenCalled();
    await userEvent.type(canvas.getByLabelText(/Recovery code/), '-9vda-h4tn');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset password' }),
    );
    await expect(recover?.onRecover).toHaveBeenCalledWith({
      name: 'SUBLO',
      code: 'k7qm-2xrp-9vda-h4tn',
      password: 'a new one!',
    });
    await userEvent.click(
      canvas.getByRole('button', { name: 'Back to sign in' }),
    );
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible();
  },
};

export const OpenedForRecovery: Story = {
  args: { recovering: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'Reset your password' }),
    ).toBeVisible();
  },
};

export const Loading: Story = { args: { kind: 'loading' } };

export const Yours: Story = {
  args: {
    kind: 'player',
    player: PLAYER,
    isMe: true,
    bestRuns: [
      { score: 41_200, level: 5, outcome: 'won' },
      { score: 38_950, level: 5, outcome: 'died' },
      { score: 30_100, level: 4, outcome: 'died' },
    ],
    share: 'idle',
    onShare: fn(),
    signOut: { isSigningOut: false, signOutFailed: false, onSignOut: fn() },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2ND')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Share my place' }),
    ).toBeVisible();
  },
};

export const Shared: Story = {
  args: {
    kind: 'player',
    player: { ...PLAYER, name: 'WOBBLEKING', rank: 1 },
    isMe: false,
    share: 'idle',
    onShare: fn(),
  },
};

export const NoPointsYet: Story = {
  args: {
    kind: 'player',
    player: { ...PLAYER, rank: null, bestScore: 0 },
    isMe: true,
    share: 'idle',
    onShare: fn(),
    signOut: { isSigningOut: false, signOutFailed: false, onSignOut: fn() },
  },
};

const recovery = {
  hasRecovery: false,
  freshCode: null,
  isIssuing: false,
  error: null,
  onIssue: fn(),
};

export const NoRecoveryCode: Story = {
  args: {
    kind: 'player',
    player: PLAYER,
    isMe: true,
    share: 'idle',
    onShare: fn(),
    recovery,
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText(/No recovery code yet/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Get a recovery code' }),
    );
    await expect(
      args.kind === 'player' && args.recovery?.onIssue,
    ).toHaveBeenCalled();
  },
};

export const FreshRecoveryCode: Story = {
  args: {
    kind: 'player',
    player: PLAYER,
    isMe: true,
    share: 'idle',
    onShare: fn(),
    recovery: {
      ...recovery,
      hasRecovery: true,
      freshCode: 'K7QM-2XRP-9VDA-H4TN',
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('K7QM-2XRP-9VDA-H4TN')).toBeVisible();
    await expect(canvas.getByText(/won't be shown again/)).toBeVisible();
  },
};

export const HasRecoveryCode: Story = {
  args: {
    kind: 'player',
    player: PLAYER,
    isMe: true,
    share: 'idle',
    onShare: fn(),
    recovery: { ...recovery, hasRecovery: true },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'Get a new code' }),
    ).toBeVisible();
  },
};
