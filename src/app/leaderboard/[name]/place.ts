import { cache } from 'react';
import { publicCaller } from '~/server/caller';

/** A shared place, looked up once per request for page, title and card. */
export const findPlace = cache((name: string) =>
  publicCaller().board.player({ name: decodeURIComponent(name) }),
);
