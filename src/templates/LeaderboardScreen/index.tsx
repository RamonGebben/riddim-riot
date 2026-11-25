import type { Ref } from 'react';
import { formatNumber } from '~/utils/formatNumber';
import { Button } from '~/atoms/Button';
import { BoardTable, type BoardRow } from '~/organisms/BoardTable';
import { PlayerCard, type PlayerCardProps } from '~/organisms/PlayerCard';
import { Backdrop } from './components/Backdrop';
import { BoardPanel } from './components/BoardPanel';
import { Columns } from './components/Columns';
import { Header } from './components/Header';
import { HomeLink } from './components/HomeLink';
import { Page } from './components/Page';
import { Shade } from './components/Shade';
import { Titles } from './components/Titles';

export interface LeaderboardScreenProps {
  rows: Array<BoardRow>;
  /** Players with points, on the board or below it. */
  ranked: number;
  isLoading: boolean;
  error: string | null;
  /** The name to light up: yours, or the shared one. */
  highlight: string | null;
  card: PlayerCardProps;
  /** The start page: home, and where a run starts. */
  playHref: string;
  /** Where the live level is drawn behind the page. */
  backdropRef?: Ref<HTMLDivElement>;
}

/** The board: every player's best single run. */
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
          <Titles>
            <HomeLink href={playHref}>
              <span aria-hidden>← </span>Riddim Riot
            </HomeLink>
            <h1>High scores</h1>
          </Titles>
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
                  ? `Top ${formatNumber(shown)} of ${formatNumber(ranked)} players`
                  : `${formatNumber(ranked)} ${ranked === 1 ? 'player' : 'players'}`}
              </p>
            )}
          </BoardPanel>
          <PlayerCard {...card} />
        </Columns>
      </Page>
    </>
  );
};
