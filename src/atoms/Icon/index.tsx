import styled from 'styled-components';
import { ICON_SIZE, type Icon as IconData } from '~/game/icons';

export interface IconProps {
  icon: IconData;
  /** Read out instead of hidden, when the icon is the only label. */
  label?: string;
  className?: string;
}

const Svg = styled.svg`
  display: block;
  inline-size: 1em;
  block-size: 1em;
  flex: none;
  overflow: visible;
`;

/** One of the game's icons, in `currentColor`, sized by the font. */
export const Icon = ({ icon, label, className }: IconProps) => {
  return (
    <Svg
      viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {icon.map(({ d, fill }) =>
        fill ? (
          <path key={d} d={d} fill="currentColor" />
        ) : (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ),
      )}
    </Svg>
  );
};
