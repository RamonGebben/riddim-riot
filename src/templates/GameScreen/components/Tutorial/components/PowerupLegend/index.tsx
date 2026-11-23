import styled from 'styled-components';
import { Icon } from '~/atoms/Icon';
import { POWERUP_COLORS, POWERUP_ICONS } from '~/game/icons';
import { POWERUP_KINDS, POWERUP_NAMES, type PowerupKind } from '~/game/sim';
import { cssColor } from '~/utils/cssColor';

/** What each one does, in a line. */
const EFFECTS = {
  pellet: 'enemies run; walk into one to eat it for double points.',
  halfTime: 'enemies step only every other beat.',
  chord: 'every shot fires three ways.',
} satisfies Record<PowerupKind, string>;

/** Names in one column, what they do lined up in the next. */
const List = styled.ul`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.spacing('xxs')}
    ${({ theme }) => theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
  color: ${({ theme }) => theme.color('secondary')};
`;

const Item = styled.li`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: baseline;
`;

/** Its icon and name in its own colour, as on the floor and in the HUD. */
const Name = styled.strong<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  align-self: center;
  color: ${({ $color }) => $color};
`;

/** The powerups an enemy can drop, each with its icon and what it does. */
export const PowerupLegend = () => (
  <List aria-label="Powerups">
    {POWERUP_KINDS.map(kind => (
      <Item key={kind}>
        <Name $color={cssColor(POWERUP_COLORS[kind])}>
          <Icon icon={POWERUP_ICONS[kind]} />
          {POWERUP_NAMES[kind]}
        </Name>
        <span>{EFFECTS[kind]}</span>
      </Item>
    ))}
  </List>
);
