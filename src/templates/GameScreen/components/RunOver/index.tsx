import { Button } from '~/atoms/Button';
import { Actions } from './components/Actions';
import { Backdrop } from './components/Backdrop';
import { Heading } from './components/Heading';
import { Panel } from './components/Panel';
import { Stat } from './components/Stat';

export interface RunOverProps {
  kills: number;
  onRetry: () => void;
  onNewRun: () => void;
}

export const RunOver = ({ kills, onRetry, onNewRun }: RunOverProps) => {
  return (
    <Backdrop>
      <Panel aria-labelledby="run-over-heading">
        <Heading id="run-over-heading">Run over</Heading>
        <Stat>{kills} kills</Stat>
        <Actions>
          <Button onClick={onRetry}>Try again</Button>
          <Button onClick={onNewRun}>New run</Button>
        </Actions>
      </Panel>
    </Backdrop>
  );
};
