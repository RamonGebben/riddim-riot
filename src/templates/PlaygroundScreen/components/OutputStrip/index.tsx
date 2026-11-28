import type { Trigger } from '~/game/sound/racks';
import { OUTPUT } from '~/game/sound/racks';
import type { Tuning } from '../../tuning';
import { PanelRow } from '../PanelRow';
import { SectionWell } from '../SectionWell';

/** What every weapon shares: the makers, the FX rolls and the weapon mix. */
export const OutputStrip = ({
  tuning,
  onTrigger,
}: {
  tuning: Tuning;
  onTrigger: (sound: Trigger) => void;
}) => {
  return (
    <PanelRow as="aside" aria-label="Output" $columns="minmax(0, 1fr)">
      {OUTPUT.map(section => (
        <SectionWell
          key={section.id}
          section={section}
          tuning={tuning}
          riff={null}
          onTrigger={onTrigger}
        />
      ))}
    </PanelRow>
  );
};
