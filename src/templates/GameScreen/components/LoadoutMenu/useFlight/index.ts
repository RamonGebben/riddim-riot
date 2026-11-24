import { useLayoutEffect, useRef, type RefObject } from 'react';

/** How long a swapped weapon takes to cross the sheet. */
export const FLIGHT_MS = 280;
/** Out fast, settling in: the menu's reveal curve. */
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

const calm = () => document.documentElement.dataset.flashing === 'reduced';

const cardOf = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`[data-weapon="${CSS.escape(id)}"]`);

interface Pending {
  id: string;
  from: DOMRect;
  ghost: HTMLElement;
}

/**
 * Swapped weapons travel: `launch` measures their cards before the swap
 * renders, then a lifted copy of each flies from where it was to where it
 * lands, the real card fading in under it as it arrives. A slot that takes
 * one latches (`data-landed`, styled by the card). With flashing reduced
 * they only cross-fade in place.
 */
export const useFlight = (root: RefObject<HTMLElement | null>) => {
  const pending = useRef<Array<Pending>>([]);

  const launch = (ids: Array<string>) => {
    const sheet = root.current;
    if (!sheet) return;
    pending.current = ids.flatMap(id => {
      const card = cardOf(sheet, id);
      if (!card) return [];
      const ghost = card.cloneNode(true) as HTMLElement;
      return [{ id, from: card.getBoundingClientRect(), ghost }];
    });
  };

  // Every render: only one after `launch` has anything to fly.
  useLayoutEffect(() => {
    const flights = pending.current;
    pending.current = [];
    const sheet = root.current;
    const layer = sheet?.parentElement;
    if (!sheet || !layer || flights.length === 0) return;
    flights.forEach(({ id, from, ghost }) => {
      const card = cardOf(sheet, id);
      if (!card) return;
      card.scrollIntoView({ block: 'nearest' });
      if (card.closest('[data-group="slots"]')) {
        card.dataset.landed = '';
        card.addEventListener(
          'animationend',
          () => delete card.dataset.landed,
          { once: true },
        );
      }
      if (calm()) {
        card.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 160,
          easing: 'ease-out',
        });
        return;
      }
      const to = card.getBoundingClientRect();
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('tabindex', '-1');
      ghost.removeAttribute('data-card');
      ghost.removeAttribute('data-weapon');
      ghost.dataset.ghost = '';
      Object.assign(ghost.style, {
        position: 'fixed',
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        margin: '0',
        pointerEvents: 'none',
        zIndex: '1',
      });
      layer.append(ghost);
      const dx = to.left - from.left;
      const dy = to.top - from.top;
      ghost
        .animate(
          [
            {
              transform: 'none',
              width: `${from.width}px`,
              height: `${from.height}px`,
              opacity: 1,
            },
            {
              transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(1.04)`,
              opacity: 1,
              offset: 0.55,
            },
            {
              transform: `translate(${dx}px, ${dy}px)`,
              width: `${to.width}px`,
              height: `${to.height}px`,
              opacity: 0,
            },
          ],
          { duration: FLIGHT_MS, easing: EASE_OUT },
        )
        .finished.catch(() => {})
        .finally(() => ghost.remove());
      card.animate(
        [{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }],
        { duration: FLIGHT_MS, easing: 'ease-out' },
      );
    });
  });

  return launch;
};
