import { TRPCClientError } from '@trpc/client';
import { describe, expect, it } from 'vitest';
import { settle } from './settle';

const refused = (code: string) =>
  TRPCClientError.from({
    error: { message: 'No', code: -32600, data: { code } },
  });

describe('settle', () => {
  it('drops a saved run and refreshes the board', () => {
    expect(settle(null)).toEqual({ drop: true, refresh: true });
  });

  it('drops a refused run without refreshing', () => {
    expect(settle(refused('BAD_REQUEST'))).toEqual({
      drop: true,
      refresh: false,
    });
  });

  it('keeps a run the board was too busy for', () => {
    expect(settle(refused('TOO_MANY_REQUESTS'))).toEqual({
      drop: false,
      refresh: false,
    });
  });

  it('keeps a run when the board was out of reach', () => {
    expect(settle(new Error('offline'))).toEqual({
      drop: false,
      refresh: false,
    });
  });
});
