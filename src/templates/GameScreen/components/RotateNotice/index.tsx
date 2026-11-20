import { Cover } from './components/Cover';
import { Hint } from './components/Hint';

/**
 * Asks for landscape on a phone held upright. A link opened inside an app
 * (Discord, Instagram, …) can't turn on an iPhone: its browser only rotates
 * as far as the app does, and most apps stay upright.
 */
export const RotateNotice = () => (
  <Cover>
    <span>Turn your phone sideways to play</span>
    <Hint>
      Not turning? Open the page in Safari or Chrome: browsers inside other apps
      stay upright.
    </Hint>
  </Cover>
);
