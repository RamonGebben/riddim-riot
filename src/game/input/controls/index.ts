import type { Vec } from '../../vec';
import { isMoveKey, moveVector } from '../moveVector';
import { isTyping } from '../typing';

export interface Controls {
  /** The left stick: WASD or the arrows. */
  move: () => Vec;
  /** The cursor, in pixels from the element's top-left. */
  pointer: () => Vec;
  /** Was Space pressed since the last call? Reading it uses the press. */
  takeDash: () => boolean;
  detach: () => void;
}

/** Twin-stick on keyboard and mouse. Losing focus lets go of every key. */
export const attachControls = (element: HTMLElement): Controls => {
  const held = new Set<string>();
  let pointer: Vec = {
    x: element.clientWidth / 2,
    y: element.clientHeight / 2,
  };

  let dash = false;
  const onKeyDown = (event: KeyboardEvent) => {
    if (isTyping(event)) return;
    if (event.code === 'Space') {
      // Not a page scroll, nor a click on the focused slot button.
      event.preventDefault();
      if (!event.repeat) dash = true;
      return;
    }
    if (!isMoveKey(event.code)) return;
    event.preventDefault();
    held.add(event.code);
  };
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.code);
  const onBlur = () => held.clear();
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
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
    takeDash: () => {
      const pressed = dash;
      dash = false;
      return pressed;
    },
    detach: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      element.removeEventListener('pointermove', onPointerMove);
    },
  };
};
