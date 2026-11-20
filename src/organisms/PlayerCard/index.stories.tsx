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
  args: { kind: 'signedOut' },
} satisfies Meta<typeof PlayerCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};

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
    onSignOut: fn(),
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
    onSignOut: fn(),
  },
};
