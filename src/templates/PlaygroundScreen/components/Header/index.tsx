import { Button } from '~/atoms/Button';
import { Buttons } from '../Buttons';
import { Bar } from './components/Bar';
import { FilePicker } from './components/FilePicker';
import { Status } from './components/Status';
import { Title } from './components/Title';

export interface HeaderProps {
  unsaved: boolean;
  /** The last save, export or import result. */
  message: string | null;
  onSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  /** Back to what the game has saved. */
  onRevert: () => void;
  /** Back to the values the game shipped with. */
  onBase: () => void;
}

export const Header = ({
  unsaved,
  message,
  onSave,
  onExport,
  onImport,
  onRevert,
  onBase,
}: HeaderProps) => {
  return (
    <Bar>
      <Title>Sound playground</Title>
      <Status>
        {message ?? (unsaved ? 'Unsaved changes' : 'Matches the game')}
      </Status>
      <Buttons>
        <Button type="button" onClick={onSave} disabled={!unsaved}>
          Save to game
        </Button>
        <Button type="button" $variant="quiet" onClick={onExport}>
          Export
        </Button>
        <FilePicker>
          Import
          <input
            type="file"
            accept="application/json,.json"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.target.value = '';
            }}
          />
        </FilePicker>
        <Button
          type="button"
          $variant="quiet"
          onClick={onRevert}
          disabled={!unsaved}
        >
          Revert
        </Button>
        <Button type="button" $variant="quiet" onClick={onBase}>
          Base values
        </Button>
      </Buttons>
    </Bar>
  );
};
