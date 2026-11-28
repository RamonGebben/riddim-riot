import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { RACKS } from '~/game/sound/racks';
import { RackTabs } from '.';

const meta = {
  component: RackTabs,
  args: {
    racks: RACKS,
    active: 'wobble',
    armed: 'laser',
    onSelect: fn(),
    tabId: (id: string) => `tab-${id}`,
    panelId: 'panel',
  },
} satisfies Meta<typeof RackTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArrowBetween: Story = {
  play: async ({ args, canvas, userEvent }) => {
    canvas.getByRole('tab', { name: 'Wobble' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(args.onSelect).toHaveBeenCalledWith('track');
    await userEvent.click(canvas.getByRole('tab', { name: 'Hits' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith('hits');
  },
};
