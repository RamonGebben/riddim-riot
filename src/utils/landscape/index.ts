/** A phone or tablet: the primary pointer is a finger. */
export const TOUCH_SCREEN = '(pointer: coarse)';

/**
 * On a touch screen, go fullscreen and lock to landscape. Must run inside a
 * user gesture. Only some browsers can lock (Android Chrome can, iOS Safari
 * can't); where it fails, the game screen asks the player to turn the phone.
 */
export const goLandscape = async (): Promise<void> => {
  if (!window.matchMedia(TOUCH_SCREEN).matches) return;
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({
        navigationUI: 'hide',
      });
    }
    await screen.orientation.lock('landscape');
  } catch {
    // Not supported here: the rotate notice covers it.
  }
};
