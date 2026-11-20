import type { Ref } from 'react';
import { Button } from '~/atoms/Button';
import { BoardTable, type BoardRow } from '~/organisms/BoardTable';
import { PlayerCard, type PlayerCardProps } from '~/organisms/PlayerCard';
import { Backdrop } from './components/Backdrop';
import { BoardPanel } from './components/BoardPanel';
import { Columns } from './components/Columns';
import { Header } from './components/Header';
import { Page } from './components/Page';
import { Shade } from './components/Shade';

export interface LeaderboardScreenProps {
  rows: Array<BoardRow>;
  /** Players with points, on the board or below it. */
  ranked: number;
  isLoading: boolean;
  error: string | null;
  /** The name to light up: yours, or the shared one. */
  highlight: string | null;
  card: PlayerCardProps;
  playHref: string;
  /** Where the live level is drawn behind the page. */
  backdropRef?: Ref<HTMLDivElement>;
}

const number = (value: number) => value.toLocaleString('en');

/** The all-time board: every player's points from every run, added up. */
export const LeaderboardScreen = ({
  rows,
  ranked,
  isLoading,
  error,
  highlight,
  card,
  playHref,
  backdropRef,
}: LeaderboardScreenProps) => {
  const shown = rows.length;
  return (
    <>
      <Backdrop ref={backdropRef} aria-hidden />
      <Shade aria-hidden />
      <Page>
        <Header>
          <h1>High scores</h1>
          <Button as="a" href={playHref}>
            Drop in
          </Button>
        </Header>
        <Columns>
          <BoardPanel aria-labelledby="board-heading">
            <h2 id="board-heading">All-time points</h2>
            <BoardTable
              rows={rows}
              highlight={highlight}
              isLoading={isLoading}
              error={error}
              loadingRows={10}
            />
            {!isLoading && !error && ranked > 0 && (
              <p>
                {ranked > shown
                  ? `Top ${number(shown)} of ${number(ranked)} players`
                  : `${number(ranked)} ${ranked === 1 ? 'player' : 'players'}`}
              </p>
            )}
          </BoardPanel>
          <PlayerCard {...card} />
        </Columns>
      </Page>
    </>
  );
};
