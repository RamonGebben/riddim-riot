import type { Metadata } from 'next';
import { publicCaller } from '~/server/caller';
import { LeaderboardApp } from './_components/LeaderboardApp';

export const metadata: Metadata = {
  title: 'High scores · Riddim Riot',
  description:
    "The Riddim Riot board: every player's best run. Play a run in your browser and save it to get on it.",
  alternates: { canonical: '/leaderboard' },
  openGraph: {
    type: 'website',
    siteName: 'Riddim Riot',
    url: '/leaderboard',
    title: 'Riddim Riot high scores',
    description:
      'Every gun is a bass synth and every shot lands on the beat. Your best run is your place on the board.',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

// Fresh enough for a board that moves run by run.
export const revalidate = 30;

const LeaderboardPage = async () => {
  // Rendered with the board when the database answers; the page fetches
  // it itself when it doesn't (as at build time, with no database).
  const initialBoard = await publicCaller()
    .board.top()
    .catch(() => null);
  return <LeaderboardApp initialBoard={initialBoard} shared={null} />;
};

export default LeaderboardPage;
