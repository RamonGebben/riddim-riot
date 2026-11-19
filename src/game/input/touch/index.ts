import { ZERO, type Vec } from '../../vec';
import {
  dragStick,
  readStick,
  startStick,
  STICK_RIMS,
  type Stick,
} from '../stick';
import type { TriggerHandlers } from '../trigger';

export interface TouchControls {
  /** The last pointer was a finger, not the mouse: read aim from here. */
  active: () => boolean;
  move: () => Vec;
  /** The way the stick last pointed, held after the thumb lifts. */
  aim: () => Vec | null;
  detach: () => void;
}

const KNOB_RADIUS = 22;

const circle = (radius: number, style: string): HTMLDivElement => {
  const element = document.createElement('div');
  element.style.cssText = `position:absolute;left:0;top:0;width:${radius * 2}px;height:${radius * 2}px;margin:${-radius}px 0 0 ${-radius}px;border-radius:50%;pointer-events:none;${style}`;
  return element;
};

/** The stick drawn where the thumb is; hidden while it's up. */
const createStickView = (element: HTMLElement) => {
  const ring = circle(
    STICK_RIMS.outer,
    'border:2px solid rgb(255 255 255 / 0.35);background:rgb(255 255 255 / 0.06);',
  );
  const rim = circle(
    STICK_RIMS.inner,
    'border:1px dashed rgb(255 255 255 / 0.3);',
  );
  const knob = circle(KNOB_RADIUS, 'background:rgb(255 255 255 / 0.45);');
  const parts = [ring, rim, knob];
  parts.forEach(part => {
    part.style.display = 'none';
    part.style.zIndex = '1';
    element.append(part);
  });
  const place = (part: HTMLElement, at: Vec) => {
    part.style.transform = `translate(${at.x}px, ${at.y}px)`;
  };
  return {
    show: (stick: Stick | null) => {
      parts.forEach(part => {
        part.style.display = stick ? 'block' : 'none';
      });
      if (!stick) return;
      place(ring, stick.origin);
      place(rim, stick.origin);
      place(knob, stick.knob);
    },
    remove: () => parts.forEach(part => part.remove()),
  };
};

/**
 * Touch twin-stick: a floating stick anywhere on the left half moves and
 * aims, and the right half is the trigger for the weapon last fired (a tap
 * fires, a hold keeps firing). The HUD's slot buttons fire their own
 * weapon (see `Game.fireSlot`), so switching is just pressing another.
 */
export const attachTouchControls = (
  element: HTMLElement,
  { trigger }: { trigger: TriggerHandlers },
): TouchControls => {
  const view = createStickView(element);
  let touching = false;
  let stick: { id: number; stick: Stick } | null = null;
  let fire: { id: number } | null = null;
  let lastAim: Vec | null = null;

  const local = (event: PointerEvent): Vec => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onDown = (event: PointerEvent) => {
    touching = event.pointerType === 'touch';
    if (!touching) return;
    event.preventDefault();
    const at = local(event);
    const left = at.x < element.clientWidth / 2;
    if (left && !stick) {
      element.setPointerCapture(event.pointerId);
      stick = { id: event.pointerId, stick: startStick(at) };
      view.show(stick.stick);
    } else if (!left && !fire) {
      element.setPointerCapture(event.pointerId);
      fire = { id: event.pointerId };
      trigger.press();
    }
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') {
      // A mouse taking over hands aiming back to the cursor.
      if (event.pointerType === 'mouse') touching = false;
      return;
    }
    const at = local(event);
    if (stick?.id === event.pointerId) {
      stick = { ...stick, stick: dragStick(stick.stick, at) };
      lastAim = readStick(stick.stick).aim ?? lastAim;
      view.show(stick.stick);
    }
  };
  const onUp = (event: PointerEvent) => {
    if (stick?.id === event.pointerId) {
      stick = null;
      view.show(null);
    }
    if (fire?.id === event.pointerId) {
      fire = null;
      trigger.release();
    }
  };
  const letGo = () => {
    stick = null;
    view.show(null);
    if (fire) trigger.release();
    fire = null;
  };
  // iOS Safari pinches to zoom whatever the viewport says.
  const onGesture = (event: Event) => event.preventDefault();

  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointercancel', onUp);
  window.addEventListener('blur', letGo);
  document.addEventListener('gesturestart', onGesture);

  return {
    active: () => touching,
    move: () => (stick ? readStick(stick.stick).move : ZERO),
    aim: () => lastAim,
    detach: () => {
      letGo();
      view.remove();
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', letGo);
      document.removeEventListener('gesturestart', onGesture);
    },
  };
};
