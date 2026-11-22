import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { PlayerCard } from '.';

const PLAYER = {
  name: 'RIDDIMRAT',
  rank: 2,
  totalPoints: 988_120,
  runsCount: 174,
  bestScore: 41_200,
};

const meta = {
  component: PlayerCard,
  args: { kind: 'signedOut', isEntering: false, error: null, onEnter: fn() },
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
    player: { ...PLAYER, rank: null, totalPoints: 0, bestScore: 0 },
    isMe: true,
    share: 'idle',
    onShare: fn(),
    signOut: { isSigningOut: false, signOutFailed: false, onSignOut: fn() },
  },
};
