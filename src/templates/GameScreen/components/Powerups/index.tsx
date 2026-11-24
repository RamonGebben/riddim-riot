import styled from 'styled-components';
import { Icon } from '~/atoms/Icon';
import { POWERUP_COLORS, POWERUP_ICONS } from '~/game/icons';
import { POWERUP_KINDS, POWERUP_NAMES, type PowerupKind } from '~/game/sim';
import { cssColor } from '~/utils/cssColor';
import { HudPanel } from '../HudPanel';
import { Powerup } from './components/Powerup';

export type PowerupsProps = Partial<Record<PowerupKind, number | null>>;

const List = styled(HudPanel).attrs({ as: 'ul' })`
  margin: 0;
  list-style: none;
`;

/** The powerups running, each counting down; nothing while none are. */
export const Powerups = (seconds: PowerupsProps) => {
  const running = POWERUP_KINDS.flatMap(kind => {
    const left = seconds[kind];
    return left === null || left === undefined ? [] : [{ kind, left }];
  });
  if (running.length === 0) return null;
  return (
    <List aria-label="Powerups">
      {running.map(({ kind, left }) => (
        <Powerup
          key={kind}
          $color={cssColor(POWERUP_COLORS[kind])}
          aria-label={`${POWERUP_NAMES[kind]}, ${left} s left`}
        >
          <Icon icon={POWERUP_ICONS[kind]} />
          {left}
        </Powerup>
      ))}
    </List>
  );
};
