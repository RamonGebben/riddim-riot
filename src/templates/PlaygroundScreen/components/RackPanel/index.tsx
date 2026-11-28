import styled from 'styled-components';
import type { Rack, Trigger } from '~/game/sound/racks';
import type { Tuning } from '../../tuning';
import type { RiffView } from '../CurveView';
import { columnsOf, PanelRow } from '../PanelRow';
import { SectionWell } from '../SectionWell';

const Panel = styled.div`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing('xs')};
  min-inline-size: 0;
`;

/** A rack's sections in their rows, like a synth's front panel. */
export const RackPanel = ({
  rack,
  tuning,
  riff,
  onTrigger,
  id,
  labelledBy,
}: {
  rack: Rack;
  tuning: Tuning;
  riff: RiffView;
  onTrigger: (sound: Trigger) => void;
  id: string;
  labelledBy: string;
}) => {
  const armed = tuning.weapon.sound.oscillator;
  return (
    <Panel role="tabpanel" id={id} aria-labelledby={labelledBy}>
      {rack.rows.map(row => (
        <PanelRow
          key={row.map(section => section.id).join()}
          $columns={columnsOf(row)}
        >
          {row.map(section => (
            <SectionWell
              key={section.id}
              section={section}
              tuning={tuning}
              riff={
                section.view?.kind === 'riff' && section.view.engine === armed
                  ? riff
                  : null
              }
              onTrigger={onTrigger}
            />
          ))}
        </PanelRow>
      ))}
    </Panel>
  );
};
