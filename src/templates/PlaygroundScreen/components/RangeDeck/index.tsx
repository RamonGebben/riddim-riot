import { useId } from 'react';
import styled from 'styled-components';
import { Latch } from '~/atoms/Latch';
import type { FireMode } from '~/game/playground';
import { LatchGroup } from '../LatchGroup';
import { PanelLabel } from '../PanelLabel';
import { RangeWindow } from '../RangeWindow';

const Deck = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.spacing('xs')};
  padding: ${({ theme }) => theme.spacing('xs')};
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 9%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};
`;

const Controls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing('xs')};
`;

/**
 * The firing range and its trigger: play the weapon as a level does, or
 * latch it firing while your hand is on a knob.
 */
export const RangeDeck = ({
  fire,
  onFire,
  onTap,
  mountRange,
}: {
  fire: FireMode;
  onFire: (mode: FireMode) => void;
  onTap: () => void;
  mountRange: ((element: HTMLElement) => () => void) | null;
}) => {
  const titleId = useId();
  return (
    <Deck aria-labelledby={titleId}>
      <PanelLabel id={titleId}>Firing range</PanelLabel>
      <RangeWindow mount={mountRange} />
      <Controls>
        <LatchGroup
          label="Fire"
          options={[
            { value: 'off', label: 'Off', name: 'Fire off' },
            { value: 'hold', label: 'Hold', name: 'Hold fire' },
            { value: 'mash', label: 'Mash', name: 'Mash fire' },
          ]}
          value={fire}
          onChange={onFire}
        />
        <Latch type="button" onClick={onTap}>
          Tap one shot
        </Latch>
      </Controls>
    </Deck>
  );
};
