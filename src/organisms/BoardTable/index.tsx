import { Fragment } from 'react';
import { formatNumber } from '~/utils/formatNumber';
import { ordinal } from '~/utils/ordinal';
import { Gap } from './components/Gap';
import { Notice } from './components/Notice';
import { Row } from './components/Row';
import { Table } from './components/Table';

export interface BoardRow {
  rank: number;
  name: string;
  /** The best single run: what the board ranks by. */
  bestScore: number;
  runsCount: number;
}

export interface BoardTableProps {
  rows: Array<BoardRow>;
  /** The player to light up: you, or whoever shared their place. */
  highlight?: string | null;
  /** The highlighted row just arrived: it blinks a few times. */
  fresh?: boolean;
  /** Without the runs column, for a short board in a panel. */
  compact?: boolean;
  isLoading?: boolean;
  error?: string | null;
  /** Rows that fill the space while loading, so nothing jumps. */
  loadingRows?: number;
}

/** The best-run board, with gaps where ranks are skipped. */
export const BoardTable = ({
  rows,
  highlight = null,
  fresh = false,
  compact = false,
  isLoading = false,
  error = null,
  loadingRows = 5,
}: BoardTableProps) => {
  if (error) return <Notice $error>{error}</Notice>;
  if (!isLoading && rows.length === 0)
    return <Notice>No scores yet. Finish a run to be the first.</Notice>;
  const columns = compact ? 3 : 4;
  return (
    <Table aria-busy={isLoading}>
      <thead>
        <tr>
          <th scope="col">RNK</th>
          <th scope="col">NAME</th>
          <th scope="col" data-align="end">
            BEST RUN
          </th>
          {!compact && (
            <th scope="col" data-align="end">
              RUNS
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {isLoading
          ? Array.from({ length: loadingRows }, (_, index) => (
              <Row key={index} aria-hidden>
                {Array.from({ length: columns }, (__, cell) => (
                  <td key={cell}>&nbsp;</td>
                ))}
              </Row>
            ))
          : rows.map((row, index) => {
              const mine = row.name === highlight;
              const skipped = index > 0 && row.rank > rows[index - 1].rank + 1;
              return (
                <Fragment key={row.name}>
                  {skipped && (
                    <Gap aria-hidden>
                      <td colSpan={columns}>…</td>
                    </Gap>
                  )}
                  <Row
                    $mine={mine}
                    $fresh={mine && fresh}
                    aria-current={mine ? 'true' : undefined}
                  >
                    <td>{ordinal(row.rank)}</td>
                    <td>{row.name}</td>
                    <td data-align="end">{formatNumber(row.bestScore)}</td>
                    {!compact && (
                      <td data-align="end" data-quiet>
                        {formatNumber(row.runsCount)}
                      </td>
                    )}
                  </Row>
                </Fragment>
              );
            })}
      </tbody>
    </Table>
  );
};
