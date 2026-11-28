import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { F_MINOR } from '~/game/music';
import { BASE_DESIGN } from '~/game/sound';
import { rollWeapon } from '~/game/weapons';
import type { Tuning } from '../../tuning';
import { CurveView } from '.';

const weapon = rollWeapon(42, F_MINOR, { pins: { oscillator: 'wobble' } });

const tuning: Tuning = {
  design: BASE_DESIGN,
  saved: BASE_DESIGN,
  set: fn(),
  weapon: {
    sound: weapon.sound,
    rolled: weapon.sound,
    overrides: {},
    override: fn(),
  },
};

const meta = {
  component: CurveView,
  args: { tuning, riff: null, view: { kind: 'filter', engine: 'wobble' } },
  decorators: [
    Story => (
      <div style={{ inlineSize: '32rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CurveView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filter: Story = {};
export const Sweep: Story = {
  args: { view: { kind: 'sweep', engine: 'wobble' } },
};
export const Growl: Story = {
  args: { view: { kind: 'growl', engine: 'wobble' } },
};
export const Envelope: Story = {
  args: { view: { kind: 'envelope', root: ['wobble', 'envelope'] } },
};
export const Drop: Story = {
  args: {
    view: {
      kind: 'drop',
      multiple: ['drums', 'kick', 'pitchMultiple'],
      seconds: ['drums', 'kick', 'pitchSeconds'],
    },
  },
};
export const Decay: Story = {
  args: { view: { kind: 'decay', decay: ['impact', 'bodyDecay'] } },
};
export const Response: Story = {
  args: {
    view: {
      kind: 'response',
      filter: 'bandpass',
      hz: ['impact', 'crunchHz'],
      q: ['impact', 'crunchQ'],
    },
  },
};
export const Pump: Story = { args: { view: { kind: 'pump' } } };
export const Riff: Story = {
  args: {
    view: { kind: 'riff', engine: 'wobble' },
    riff: { notes: weapon.sound.riff, every: 2, read: () => 2 },
  },
};
