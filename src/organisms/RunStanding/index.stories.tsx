import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { RunStanding } from '.';

const ROWS = [
  { rank: 1, name: 'WOBBLEKING', totalPoints: 1_204_880, runsCount: 212 },
  { rank: 2, name: 'RIDDIMRAT', totalPoints: 988_120, runsCount: 174 },
  { rank: 3, name: 'SUBLO', totalPoints: 740_005, runsCount: 98 },
];

const meta = {
  component: RunStanding,
  args: { boardHref: '/leaderboard', standing: { kind: 'saving' } },
} satisfies Meta<typeof RunStanding>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  args: {
    standing: {
      kind: 'signedOut',
      score: 31_450,
      isSubmitting: false,
      error: null,
      onEnter: fn(),
      onSkip: fn(),
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('Save 31,450 points to the high scores?'),
    ).toBeVisible();
  },
};

export const Saving: Story = {};

export const Climbed: Story = {
  args: {
    standing: {
      kind: 'saved',
      name: 'RIDDIMRAT',
      score: 31_450,
      before: { rank: 3, total: 956_670 },
      after: { rank: 2, total: 988_120 },
      rows: ROWS,
      share: 'idle',
      onShare: fn(),
    },
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByText('Up 1 place')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Share my place' }),
    );
    if (args.standing.kind === 'saved')
      await expect(args.standing.onShare).toHaveBeenCalled();
  },
};

export const FirstTimeOn: Story = {
  args: {
    standing: {
      kind: 'saved',
      name: 'NEWCOMER',
      score: 4_200,
      before: { rank: null, total: 0 },
      after: { rank: 37, total: 4_200 },
      rows: [
        ...ROWS,
        { rank: 36, name: 'DROPZONE', totalPoints: 4_900, runsCount: 3 },
        { rank: 37, name: 'NEWCOMER', totalPoints: 4_200, runsCount: 1 },
      ],
      share: 'copied',
      onShare: fn(),
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('On the board at 37TH')).toBeVisible();
  },
};

export const Failed: Story = {
  args: {
    standing: {
      kind: 'failed',
      message: "Couldn't reach the board.",
      onRetry: fn(),
    },
  },
};

export const Rejected: Story = {
  args: {
    standing: {
      kind: 'rejected',
      message: "This run can't be saved: the levels were cleared too fast",
    },
  },
};
