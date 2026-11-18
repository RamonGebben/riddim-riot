import { Button } from '~/atoms/Button';
import type { SoundDesign } from '~/game/sound';
import { valueAt, type DesignPath, type FieldGroup } from '~/game/sound/schema';
import { ParamControl } from '~/molecules/ParamControl';
import { Description } from './components/Description';
import { Details } from './components/Details';
import { Fields } from './components/Fields';
import { Summary } from './components/Summary';

export interface ParamGroupProps {
  group: FieldGroup;
  design: SoundDesign;
  /** What the game has saved, to mark and count changed values. */
  saved: SoundDesign;
  open?: boolean;
  onChange: (path: DesignPath, value: unknown) => void;
  /** Put this group back to what's saved. */
  onReset: () => void;
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export const ParamGroup = ({
  group,
  design,
  saved,
  open = false,
  onChange,
  onReset,
}: ParamGroupProps) => {
  const changed = group.fields.filter(
    field => !same(valueAt(design, field.path), valueAt(saved, field.path)),
  );
  return (
    <Details open={open}>
      <Summary>
        <span>{group.title}</span>
        {changed.length > 0 && <span>{changed.length} changed</span>}
      </Summary>
      <Description>{group.description}</Description>
      <Fields>
        {group.fields.map(field => (
          <ParamControl
            key={field.path.join('.')}
            field={field}
            value={valueAt(design, field.path)}
            changed={changed.includes(field)}
            onChange={value => onChange(field.path, value)}
          />
        ))}
      </Fields>
      {changed.length > 0 && (
        <Fields>
          <Button type="button" $variant="quiet" onClick={onReset}>
            Reset {group.title.toLowerCase()}
          </Button>
        </Fields>
      )}
    </Details>
  );
};
