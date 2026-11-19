import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stat } from '../Stat';
import { Stats } from '.';

const meta = {
  component: Stats,
  args: {
    children: (
      <>
        <Stat>
          <dt>Kills</dt>
          <dd>45</dd>
        </Stat>
        <Stat>
          <dt>Points</dt>
          <dd>10,100</dd>
        </Stat>
      </>
    ),
  },
} satisfies Meta<typeof Stats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
