export type ShareResult = 'idle' | 'shared' | 'copied' | 'failed';

/** The page that shows a player's place, and makes their share card. */
export const placePath = (name: string) =>
  `/leaderboard/${encodeURIComponent(name)}`;

type Sharer = {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: Pick<Clipboard, 'writeText'>;
};

/**
 * Offers the link through the device's share sheet where there is one,
 * else copies it. A share sheet closed without sharing is no failure.
 */
export const sharePlace = async (
  url: string,
  text: string,
  sharer: Sharer = navigator,
): Promise<ShareResult> => {
  if (sharer.share) {
    try {
      await sharer.share({ url, text });
      return 'shared';
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') return 'idle';
    }
  }
  try {
    await sharer.clipboard?.writeText(url);
    return sharer.clipboard ? 'copied' : 'failed';
  } catch {
    return 'failed';
  }
};
