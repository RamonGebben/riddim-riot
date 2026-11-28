import styled from 'styled-components';
import type { Section } from '~/game/sound/racks';

/**
 * A row of sections in one frame, as a synth's panel is: side by side with
 * dividers, sharing a height, each as wide as its knobs (and its curve)
 * need. Stacked on a narrow screen.
 */
export const PanelRow = styled.div<{ $columns: string }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border: ${({ theme }) => theme.borderWidth('s')} solid
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('background', 'text')} 9%,
      transparent
    );
  border-radius: ${({ theme }) => theme.borderRadius('s')};
  background: ${({ theme }) => theme.color('formBackground')};

  & > * + * {
    border-block-start: ${({ theme }) => theme.borderWidth('s')} solid
      ${({ theme }) => theme.color('background')};
  }

  @media (min-width: 900px) {
    grid-template-columns: ${({ $columns }) => $columns};

    & > * + * {
      border-block-start: none;
      border-inline-start: ${({ theme }) => theme.borderWidth('s')} solid
        ${({ theme }) => theme.color('background')};
    }
  }
`;

/** How much of its row a section takes: its knobs, or room for its curve. */
export const weightOf = (section: Section): number =>
  Math.max(
    section.knobs.length + (section.weapon?.length ?? 0),
    section.view ? 3 : 1,
  );

/** A row's columns, each section's share by its weight. */
export const columnsOf = (row: Array<Section>): string =>
  row.map(section => `minmax(min-content, ${weightOf(section)}fr)`).join(' ');
