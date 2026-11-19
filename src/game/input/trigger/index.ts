export interface TriggerHandlers {
  press: () => void;
  release: () => void;
}

/**
 * Left mouse button (or a pen) on `element` pulls the trigger. Pointer capture keeps a
 * hold going when the cursor leaves the element; losing focus lets go, so a
 * gun can't get stuck firing.
 */
export const attachTrigger = (
  element: HTMLElement,
  { press, release }: TriggerHandlers,
): (() => void) => {
  // Fingers fire from the touch controls' own half of the screen.
  const onDown = (event: PointerEvent) => {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    press();
  };
  const onUp = (event: PointerEvent) => {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    release();
  };
  const onCancel = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') release();
  };
  const onContextMenu = (event: Event) => event.preventDefault();

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onCancel);
  element.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', release);

  return () => {
    element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointerup', onUp);
    element.removeEventListener('pointercancel', onCancel);
    element.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', release);
  };
};
