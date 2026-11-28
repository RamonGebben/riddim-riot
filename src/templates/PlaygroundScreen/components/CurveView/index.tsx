import type { CurveView as View } from '~/game/sound/racks';
import type { Tuning } from '../../tuning';
import { DecayScreen } from './components/DecayScreen';
import { DropScreen } from './components/DropScreen';
import { EnvelopeScreen } from './components/EnvelopeScreen';
import { FilterScreen } from './components/FilterScreen';
import { GrowlScreen } from './components/GrowlScreen';
import { PumpScreen } from './components/PumpScreen';
import { ResponseScreen } from './components/ResponseScreen';
import { RiffSteps, type RiffView } from './components/RiffSteps';
import { SweepScreen } from './components/SweepScreen';

export type { RiffView };

/** A section's curve, drawn from the design (and the weapon) it shows. */
export const CurveView = ({
  view,
  tuning,
  riff,
}: {
  view: View;
  tuning: Tuning;
  /** The armed weapon's riff, or null when another engine is armed. */
  riff: RiffView | null;
}) => {
  switch (view.kind) {
    case 'filter':
      return <FilterScreen engine={view.engine} tuning={tuning} />;
    case 'sweep':
      return <SweepScreen engine={view.engine} tuning={tuning} />;
    case 'growl':
      return <GrowlScreen engine={view.engine} tuning={tuning} />;
    case 'envelope':
      return <EnvelopeScreen root={view.root} tuning={tuning} />;
    case 'drop':
      return (
        <DropScreen
          multiple={view.multiple}
          seconds={view.seconds}
          tuning={tuning}
        />
      );
    case 'decay':
      return <DecayScreen decay={view.decay} tuning={tuning} />;
    case 'response':
      return (
        <ResponseScreen
          filter={view.filter}
          hz={view.hz}
          q={view.q}
          tuning={tuning}
        />
      );
    case 'pump':
      return <PumpScreen tuning={tuning} />;
    case 'riff':
      return riff ? <RiffSteps riff={riff} /> : null;
  }
};
