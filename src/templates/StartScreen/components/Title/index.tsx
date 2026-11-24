import { Heading } from './components/Heading';
import { Line } from './components/Line';
import { Ring } from './components/Ring';

/**
 * The wordmark: RIDDIM over RIOT, whose O is the circle every level starts
 * in. Named whole: the drawn ring splits the word for a screen reader.
 */
export const Title = () => (
  <Heading aria-label="Riddim Riot">
    <span aria-hidden>
      <Line $lead>Riddim</Line>{' '}
      <Line>
        Ri
        <Ring />t
      </Line>
    </span>
  </Heading>
);
