import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { LeaderboardScreen } from '.';

const NAMES = [
  'WOBBLEKING',
  'RIDDIMRAT',
  'SUBLO',
  'K_HALFTIME',
  'BASSFACE',
  'DROPZONE',
  'LOWEND',
  'REESE_42',
  'HALFSTEP',
  'GROWL',
  'NEUROFUNK',
  'SIDECHAIN',
];

const ROWS = NAMES.map((name, index) => ({
  rank: index + 1,
  name,
  totalPoints: Math.round(1_204_880 / (1 + index * 0.35)),
  runsCount: 212 - index * 13,
}));

const meta = {
  component: LeaderboardScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    rows: ROWS,
    ranked: 37,
    isLoading: false,
    error: null,
    highlight: 'RIDDIMRAT',
    playHref: '/',
    card: {
      kind: 'player',
      isMe: true,
      player: {
        name: 'RIDDIMRAT',
        rank: 2,
        totalPoints: ROWS[1].totalPoints,
        runsCount: ROWS[1].runsCount,
        bestScore: 41_200,
      },
      bestRuns: [
        { score: 41_200, level: 5, outcome: 'won' },
        { score: 38_950, level: 5, outcome: 'died' },
        { score: 30_100, level: 4, outcome: 'died' },
      ],
      share: 'idle',
      onShare: fn(),
      onSignOut: fn(),
    },
  },
} satisfies Meta<typeof LeaderboardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('heading', { name: 'High scores' }),
    ).toBeVisible();
    await expect(canvas.getByText('Top 12 of 37 players')).toBeVisible();
  },
};

export const SignedOut: Story = {
  args: { highlight: null, card: { kind: 'signedOut' } },
};

export const Loading: Story = {
  args: { rows: [], isLoading: true, card: { kind: 'loading' } },
};

export const Empty: Story = {
  args: { rows: [], ranked: 0, highlight: null, card: { kind: 'signedOut' } },
};
