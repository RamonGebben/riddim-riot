import type { Vec } from '../../vec';
import { isMoveKey, moveVector } from '../moveVector';

export interface Controls {
  /** The left stick: WASD or the arrows. */
  move: () => Vec;
  /** The cursor, in pixels from the element's top-left. */
  pointer: () => Vec;
  detach: () => void;
}

/** Twin-stick on keyboard and mouse. Losing focus lets go of every key. */
export const attachControls = (element: HTMLElement): Controls => {
  const held = new Set<string>();
  let pointer: Vec = {
    x: element.clientWidth / 2,
    y: element.clientHeight / 2,
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isMoveKey(event.code)) return;
    event.preventDefault();
    held.add(event.code);
  };
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.code);
  const onBlur = () => held.clear();
  const onPointerMove = (event: PointerEvent) => {
    const rect = element.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  element.addEventListener('pointermove', onPointerMove);

  return {
    move: () => moveVector(held),
    pointer: () => pointer,
    detach: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      element.removeEventListener('pointermove', onPointerMove);
    },
  };
};
