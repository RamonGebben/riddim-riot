'use client';

import { useState } from 'react';
import { readPendingRun } from '~/utils/pendingRun';
import { useSaveRun } from '../useSaveRun';

/**
 * Saves a run left on this device (the board was out of reach when it
 * ended) once you're signed in. Renders nothing.
 */
export const SavePendingRun = () => {
  const [pending] = useState(readPendingRun);
  useSaveRun(pending);
  return null;
};
