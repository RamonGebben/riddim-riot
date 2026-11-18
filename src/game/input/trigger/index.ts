export interface TriggerHandlers {
  press: () => void;
  release: () => void;
}

/**
 * Left mouse button on `element` pulls the trigger. Pointer capture keeps a
 * hold going when the cursor leaves the element; losing focus lets go, so a
 * gun can't get stuck firing.
 */
export const attachTrigger = (
  element: HTMLElement,
  { press, release }: TriggerHandlers,
): (() => void) => {
  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    press();
  };
  const onUp = (event: PointerEvent) => {
    if (event.button !== 0) return;
    release();
  };
  const onContextMenu = (event: Event) => event.preventDefault();

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', release);
  element.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', release);

  return () => {
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointerup', onUp);
    element.removeEventListener('pointercancel', release);
    element.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', release);
  };
};
