import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { BoardTable, type BoardRow } from '.';

const TOP: Array<BoardRow> = [
  { rank: 1, name: 'WOBBLEKING', totalPoints: 1_204_880, runsCount: 212 },
  { rank: 2, name: 'RIDDIMRAT', totalPoints: 988_120, runsCount: 174 },
  { rank: 3, name: 'SUBLO', totalPoints: 740_005, runsCount: 98 },
  { rank: 4, name: 'K_HALFTIME', totalPoints: 612_300, runsCount: 121 },
  { rank: 5, name: 'BASSFACE', totalPoints: 598_770, runsCount: 87 },
];

const meta = {
  component: BoardTable,
  args: { rows: TOP },
} satisfies Meta<typeof BoardTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {};

export const YoursLit: Story = {
  args: { highlight: 'RIDDIMRAT', fresh: true },
  play: async ({ canvas }) => {
    const mine = canvas.getByRole('row', { current: true });
    await expect(mine).toHaveTextContent('2NDRIDDIMRAT988,120');
  },
};

export const AroundYou: Story = {
  args: {
    compact: true,
    highlight: 'NEWCOMER',
    rows: [
      ...TOP.slice(0, 3),
      { rank: 36, name: 'DROPZONE', totalPoints: 48_900, runsCount: 14 },
      { rank: 37, name: 'NEWCOMER', totalPoints: 48_210, runsCount: 12 },
      { rank: 38, name: 'LOWEND', totalPoints: 47_100, runsCount: 30 },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('…')).toBeInTheDocument();
    await expect(canvas.queryByText('RUNS')).toBeNull();
  },
};

export const Loading: Story = { args: { rows: [], isLoading: true } };

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/No scores yet/)).toBeVisible();
  },
};

export const Failed: Story = {
  args: { rows: [], error: "Couldn't load the board. Try again in a moment." },
};
