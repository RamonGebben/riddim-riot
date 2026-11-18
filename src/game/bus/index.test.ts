import { describe, expect, it, vi } from 'vitest';
import { createBus } from '.';

interface TestEvents {
  tick: { step: number };
  kill: { id: string };
}

describe('createBus', () => {
  it('delivers a payload to every handler of that type only', () => {
    const bus = createBus<TestEvents>();
    const onTick = vi.fn();
    const onOtherTick = vi.fn();
    const onKill = vi.fn();
    bus.on('tick', onTick);
    bus.on('tick', onOtherTick);
    bus.on('kill', onKill);

    bus.emit('tick', { step: 3 });

    expect(onTick).toHaveBeenCalledWith({ step: 3 });
    expect(onOtherTick).toHaveBeenCalledWith({ step: 3 });
    expect(onKill).not.toHaveBeenCalled();
  });

  it('stops delivering after unsubscribe', () => {
    const bus = createBus<TestEvents>();
    const onTick = vi.fn();
    const off = bus.on('tick', onTick);

    off();
    bus.emit('tick', { step: 1 });

    expect(onTick).not.toHaveBeenCalled();
  });

  it('lets a handler unsubscribe while the event is being delivered', () => {
    const bus = createBus<TestEvents>();
    const second = vi.fn();
    const off = bus.on('tick', () => off());
    bus.on('tick', second);

    bus.emit('tick', { step: 1 });
    bus.emit('tick', { step: 2 });

    expect(second).toHaveBeenCalledTimes(2);
  });
});
