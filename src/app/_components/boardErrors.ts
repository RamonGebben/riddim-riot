import { TRPCClientError } from '@trpc/client';

/** The server's own words when it refused, else that it couldn't be reached. */
export const boardError = (error: unknown) => {
  if (error instanceof TRPCClientError && error.data?.code) {
    // Input checks come back as a list of issues; the form checks first.
    if (error.data.code === 'BAD_REQUEST' && error.message.startsWith('['))
      return 'Check the name and password.';
    return error.message;
  }
  return "Couldn't reach the board.";
};

/** Refused for good: retrying the same run won't change the answer. */
export const isRefusal = (error: unknown) =>
  error instanceof TRPCClientError && error.data?.code === 'BAD_REQUEST';
