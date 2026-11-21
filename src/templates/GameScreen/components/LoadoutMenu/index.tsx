import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Button } from '~/atoms/Button';
import { Icon } from '~/atoms/Icon';
import {
  BLAST_ICON,
  CLIMB_ICON,
  FX_ICONS,
  PLAY_ICON,
  STOP_ICON,
  WEAPON_ICONS,
} from '~/game/icons';
import { SegmentedControl } from '~/molecules/SegmentedControl';
import {
  describeTraits,
  WeaponTag,
  type WeaponFace,
} from '~/molecules/WeaponTag';
import { PointerOnly } from '../PointerOnly';
import { Announce } from './components/Announce';
import { Caption } from './components/Caption';
import { Card } from './components/Card';
import { Column } from './components/Column';
import { Columns } from './components/Columns';
import { Compare } from './components/Compare';
import { CompareSide } from './components/CompareSide';
import { Empty } from './components/Empty';
import { Fresh } from './components/Fresh';
import { Header } from './components/Header';
import { HearButton } from './components/HearButton';
import { Insert } from './components/Insert';
import { PlaceRow } from './components/PlaceRow';
import { RackRow } from './components/RackRow';
import { Scrim } from './components/Scrim';
import { Section } from './components/Section';
import { Sheet } from './components/Sheet';
import { Shelf } from './components/Shelf';
import { SlotList } from './components/SlotList';
import { SortRow } from './components/SortRow';
import { StepGrid } from './components/StepGrid';
import { Stats } from './components/Stats';
import { Tag } from './components/Tag';
import {
  changed,
  choiceOf,
  discardAll,
  likelySlot,
  placeOf,
  rackOf,
  sortBag,
  swap,
  toggleDiscard,
  weakerInBag,
  type BagOrder,
  type Choice,
  type Rack,
} from './rack';

import { verdictOf, type Verdict, type WeaponStats } from './verdict';

export type { Choice } from './rack';
export type { WeaponStats } from './verdict';

export interface MenuWeapon extends WeaponFace {
  /** Unique within the menu: a recipe can turn up twice. */
  id: string;
  /** Vandal or Lumen. */
  maker: string;
  /** Dropped by a boss. */
  bossLoot: boolean;
  stats: WeaponStats;
  /** Picked up since the menu was last open. */
  fresh?: boolean;
}

export interface LoadoutMenuProps {
  heading: string;
  slots: Array<MenuWeapon>;
  /** Oldest first, as they were picked up. */
  bag: Array<MenuWeapon>;
  bagSize: number;
  /** Where the loadout is kept, and what happens to the bag. */
  note?: string;
  doneLabel: string;
  /** New weapons are being armed: Done waits for them. */
  isApplying?: boolean;
  /** Arming failed: what to say, with the menu still open. */
  error?: string | null;
  /**
   * What's being heard: one weapon, or an A/B of two (`ids`), and the one
   * sounding right now - null until its bar starts. `turn` counts bars.
   */
  preview?: {
    ids: Array<string>;
    sounding: string | null;
    turn: number;
  } | null;
  /** A bar at the game's tempo: how long a playhead takes to sweep. */
  barSeconds?: number;
  onPreview?: (id: string) => void;
  /** Hear `a` for a bar, then `b`, back and forth. */
  onPreviewAB?: (a: string, b: string) => void;
  onStopPreview?: () => void;
  /** Closed with the weapons where the player put them. */
  onDone: (choice: Choice) => void;
}

const ORDERS: Array<{ value: BagOrder; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'best', label: 'Best' },
  { value: 'engine', label: 'Engine' },
];

const ENGINE_NAMES = { wobble: 'Wobble', laser: 'Laser', beam: 'Beam' };
const FX_NAMES = { distortion: 'Crush', echo: 'Echo' };

/** Sorting earns its row once the bag is worth digging through. */
const SORT_FROM = 6;

const SLOT_KEYS: Record<string, number> = { Digit1: 0, Digit2: 1, Digit3: 2 };

const STATS: Array<{ key: keyof WeaponStats; label: string; unit: string }> = [
  { key: 'perBar', label: 'Damage a bar', unit: '' },
  { key: 'hit', label: 'Per hit', unit: '' },
  { key: 'shots', label: 'Shots', unit: ' a bar' },
  { key: 'reach', label: 'Reach', unit: ' tiles' },
  { key: 'area', label: 'Blast', unit: ' tiles' },
];

const VERDICTS = {
  stronger: 'Stronger',
  'trade-off': 'Trade-off',
  weaker: 'Weaker',
} satisfies Record<Verdict, string>;

/** How a verdict reads in a sentence about the slot it's against. */
const VERDICT_SENTENCES = {
  stronger: 'Stronger than',
  'trade-off': 'A trade-off against',
  weaker: 'Weaker than',
} satisfies Record<Verdict, string>;

const signed = (value: number) =>
  `${value > 0 ? '+' : '−'}${Math.abs(Math.round(value * 10) / 10)}`;

const FOCUSABLE =
  'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])';

const ARROWS = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

const isArrow = (key: string): key is keyof typeof ARROWS => key in ARROWS;

const centre = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** A weapon's numbers, and how they differ from `against`'s. */
const StatList = ({
  stats,
  against,
}: {
  stats: WeaponStats;
  against?: WeaponStats;
}) => (
  <Stats>
    {STATS.map(({ key, label, unit }) => {
      const delta = against ? stats[key] - against[key] : 0;
      return (
        <div key={key}>
          <dt>{label}</dt>
          <dd>
            {stats[key] === 0 && key === 'area'
              ? 'none'
              : `${stats[key]}${unit}`}
          </dd>
          <dd
            data-delta={delta > 0 ? 'up' : delta < 0 ? 'down' : undefined}
            aria-label={
              delta === 0
                ? undefined
                : `${delta > 0 ? 'better' : 'worse'} by ${Math.abs(delta)}`
            }
          >
            {delta === 0 ? '' : signed(delta)}
          </dd>
        </div>
      );
    })}
  </Stats>
);

/**
 * The loadout and the run's bag, side by side like a gear screen: pick a
 * weapon and it's laid beside the one it would replace, with the numbers
 * that change and a button to hear each. Mid-level the track's bar loops
 * under it while the game waits; after a run it sorts what the next run
 * starts with.
 */
export const LoadoutMenu = ({
  heading,
  slots,
  bag,
  bagSize,
  note,
  doneLabel,
  isApplying = false,
  error = null,
  preview = null,
  barSeconds,
  onPreview,
  onPreviewAB,
  onStopPreview,
  onDone,
}: LoadoutMenuProps) => {
  const opened = useMemo(
    (): Choice => ({
      slots: slots.map(({ id }) => id),
      bag: bag.map(({ id }) => id),
    }),
    [slots, bag],
  );
  const [rack, setRack] = useState<Rack>(() => rackOf(opened));
  const [picked, setPicked] = useState<string | null>(null);
  /** The slot or weapon the pick is held against, by hover or focus. */
  const [aim, setAim] = useState<string | null>(null);
  const [order, setOrder] = useState<BagOrder>('newest');
  /** Esc was pressed with weapons marked: the next one throws them out. */
  const [confirming, setConfirming] = useState(false);
  const sheet = useRef<HTMLElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const compareRef = useRef<HTMLElement>(null);
  const weapons = useMemo(
    () => new Map([...slots, ...bag].map(weapon => [weapon.id, weapon])),
    [slots, bag],
  );
  // Revealed once, on the menu's first render, never again as cards move.
  const [reveals] = useState(
    () =>
      new Map(
        bag
          .filter(weapon => weapon.fresh)
          .toReversed()
          .map((weapon, i) => [weapon.id, i]),
      ),
  );

  const pickedIn = picked ? (placeOf(rack, picked)?.in ?? null) : null;
  const pickedWeapon = picked ? weapons.get(picked) : undefined;
  const discarding = picked !== null && rack.discarded.includes(picked);
  const kept = choiceOf(rack).bag.length;
  const dirty = changed(rack, opened);

  /** The slot a bag pick is laid against: aimed at, else the likely one. */
  const targetSlot = (() => {
    if (pickedIn !== 'bag' || !picked) return null;
    const aimed = aim ? rack.slots.indexOf(aim) : -1;
    return aimed >= 0 ? aimed : likelySlot(rack, weapons, picked);
  })();
  const against = (() => {
    if (targetSlot !== null) return weapons.get(rack.slots[targetSlot]);
    if (pickedIn === 'slots' && aim && aim !== picked) return weapons.get(aim);
    return undefined;
  })();

  const done = () => {
    if (isApplying) return;
    onStopPreview?.();
    onDone(choiceOf(rack));
  };

  /** Esc closes, but asks once before it throws marked weapons away. */
  const escape = () => {
    if (rack.discarded.length > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    done();
  };

  /**
   * A second pick trades places with the first; a third starts over. Any
   * pick stops what's being heard: it was about the last pick.
   */
  const pick = (id: string) => {
    setAim(null);
    if (preview) onStopPreview?.();
    if (!picked || picked === id) {
      setPicked(picked === id ? null : id);
      return;
    }
    const swapped = swap(rack, picked, id);
    if (!swapped) {
      setPicked(id);
      return;
    }
    setRack(swapped);
    setPicked(null);
  };

  /** The pick into slot `index`, by key, button or double-click. */
  const place = (index: number) => {
    const into = rack.slots[index];
    if (picked && into) pick(into);
  };

  /** This one weapon is being heard on its own. */
  const hearing = (id: string) =>
    preview?.ids.length === 1 && preview.ids[0] === id;
  const sounding = (id: string) => preview?.sounding === id;
  const abOn = preview?.ids.length === 2;

  const hear = (id: string) => {
    if (hearing(id)) onStopPreview?.();
    else onPreview?.(id);
  };

  /** The pick against what it would replace, a bar each, or stop. */
  const toggleAB = () => {
    if (abOn) onStopPreview?.();
    else if (picked && against) onPreviewAB?.(picked, against.id);
  };

  useEffect(() => first.current?.focus(), []);

  // On a phone the comparison can sit out of view of the card just picked:
  // bring it in, so the pick is answered where the player can see it.
  useEffect(() => {
    if (!picked) return;
    const calm = document.documentElement.dataset.flashing === 'reduced';
    compareRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: calm ? 'auto' : 'smooth',
    });
  }, [picked]);

  // Keys reach the menu wherever focus is.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'Escape' || event.code === 'KeyB') {
        event.preventDefault();
        escape();
        return;
      }
      setConfirming(false);
      if (event.code === 'KeyH' && picked) {
        event.preventDefault();
        if (against) toggleAB();
        else hear(picked);
        return;
      }
      const discardKey = event.code === 'Delete' || event.code === 'Backspace';
      if (discardKey && pickedIn === 'bag' && picked) {
        event.preventDefault();
        setRack(toggleDiscard(rack, picked));
        return;
      }
      const slot = SLOT_KEYS[event.code];
      if (slot === undefined || !picked || discarding) return;
      event.preventDefault();
      place(slot);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  /** Tab stays inside; arrows walk the cards like a grid. */
  const onSheetKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const root = sheet.current;
    if (!root) return;
    if (event.key === 'Tab') {
      const focusable = [
        ...root.querySelectorAll<HTMLElement>(FOCUSABLE),
      ].filter(element => element.offsetParent !== null);
      const head = focusable[0];
      const tail = focusable.at(-1);
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail?.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head?.focus();
      }
      return;
    }
    if (!isArrow(event.key)) return;
    const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
    const from = cards.find(card => card === document.activeElement);
    if (!from) return;
    event.preventDefault();
    const direction = ARROWS[event.key];
    const here = centre(from);
    const group = (card: HTMLElement) =>
      card.closest('[data-group]')?.getAttribute('data-group');
    /** The nearest card that way among `among`. */
    const nearest = (among: Array<HTMLElement>) =>
      among
        .filter(card => card !== from)
        .map(card => {
          const there = centre(card);
          const dx = there.x - here.x;
          const dy = there.y - here.y;
          const along = dx * direction.x + dy * direction.y;
          const across = Math.abs(dx * direction.y + dy * direction.x);
          return { card, along, score: along + across * 2 };
        })
        .filter(({ along }) => along > 1)
        .toSorted((a, b) => a.score - b.score)[0]?.card;
    // Within the slots or the bag first; across only from its edge.
    const next =
      nearest(cards.filter(card => group(card) === group(from))) ??
      nearest(cards);
    next?.focus();
  };

  /** The slot a bag weapon would clearly beat, if any: its upgrade mark. */
  const upgradeFor = (id: string) => {
    const weapon = weapons.get(id);
    const slot = likelySlot(rack, weapons, id);
    const held = weapons.get(rack.slots[slot]);
    return weapon && held && verdictOf(weapon.stats, held.stats) === 'stronger'
      ? slot
      : null;
  };
  const weaker = weakerInBag(rack, weapons);
  const full = kept >= bagSize;

  /** One line for a screen reader, on the pick alone, never on aim. */
  const announcement = (() => {
    if (!pickedWeapon || !picked) return '';
    if (pickedIn === 'slots')
      return `${pickedWeapon.name} picked, in slot ${rack.slots.indexOf(picked) + 1}.`;
    const slot = likelySlot(rack, weapons, picked);
    const held = weapons.get(rack.slots[slot]);
    if (!held) return `${pickedWeapon.name} picked.`;
    const verdict =
      VERDICT_SENTENCES[verdictOf(pickedWeapon.stats, held.stats)];
    return `${pickedWeapon.name} picked. ${verdict} slot ${slot + 1}, ${held.name}.`;
  })();

  /** A weapon's bar of steps, swept by a playhead while it's heard. */
  const stepsFor = (weapon: MenuWeapon, size: 'row' | 'mini' = 'row') => (
    <StepGrid
      oscillator={weapon.oscillator}
      lfo={weapon.lfo}
      fx={weapon.fx}
      size={size}
      sounding={sounding(weapon.id)}
      turn={preview?.turn}
      barSeconds={barSeconds}
    />
  );

  /** A slot as a track: engine, beat, name with its inserts, then steps. */
  const trackOf = (weapon: MenuWeapon) => (
    <>
      <span data-part="engine">
        <Icon icon={WEAPON_ICONS[weapon.oscillator]} />
      </span>
      <span data-part="rate">{weapon.lfo}</span>
      <span data-part="name">
        {ENGINE_NAMES[weapon.oscillator]}
        {weapon.fx && <Insert>{FX_NAMES[weapon.fx]}</Insert>}
        {weapon.blasts && <Insert>Blast</Insert>}
        {weapon.bossLoot && <Tag>Boss</Tag>}
      </span>
      {stepsFor(weapon)}
    </>
  );

  /** A bag weapon as a card: its face over a small bar of steps. */
  const faceOf = (weapon: MenuWeapon, upgrade: number | null = null) => (
    <>
      <span data-part="engine">
        <Icon icon={WEAPON_ICONS[weapon.oscillator]} />
      </span>
      <span data-part="rate">{weapon.lfo}</span>
      <span data-part="badges">
        {upgrade !== null && (
          <span data-part="upgrade">
            <Icon icon={CLIMB_ICON} />
          </span>
        )}
        {weapon.fx && <Icon icon={FX_ICONS[weapon.fx]} />}
        {weapon.blasts && <Icon icon={BLAST_ICON} />}
      </span>
      <span data-part="name">
        {ENGINE_NAMES[weapon.oscillator]}
        {weapon.fx && ` · ${FX_NAMES[weapon.fx]}`}
        {weapon.bossLoot && <Tag>Boss</Tag>}
      </span>
      {stepsFor(weapon, 'mini')}
    </>
  );

  const hearButton = (weapon: MenuWeapon) => (
    <HearButton
      type="button"
      $playing={hearing(weapon.id)}
      aria-label={
        hearing(weapon.id) ? `Stop ${weapon.name}` : `Hear ${weapon.name}`
      }
      onClick={() => hear(weapon.id)}
    >
      <Icon icon={hearing(weapon.id) ? STOP_ICON : PLAY_ICON} />
    </HearButton>
  );

  const bagCard = (id: string) => {
    const weapon = weapons.get(id);
    if (!weapon) return null;
    const thrown = rack.discarded.includes(id);
    const upgrade = upgradeFor(id);
    return (
      <li key={id}>
        <Card
          data-card
          type="button"
          $picked={picked === id}
          $target={pickedIn === 'slots' && aim === id}
          $discarded={thrown}
          $reveal={reveals.get(id)}
          aria-pressed={picked === id}
          aria-label={[
            weapon.name,
            weapon.bossLoot && 'boss loot',
            weapon.fresh && 'new',
            upgrade !== null && `stronger than slot ${upgrade + 1}`,
            thrown && 'marked to discard',
          ]
            .filter(Boolean)
            .join(', ')}
          onClick={() => pick(id)}
          onDoubleClick={() => {
            if (pickedIn === 'bag' && picked === id && targetSlot !== null)
              place(targetSlot);
          }}
          onPointerEnter={() => setAim(id)}
          onFocus={() => setAim(id)}
        >
          {faceOf(weapon, upgrade)}
          {weapon.fresh && <Fresh aria-hidden />}
        </Card>
      </li>
    );
  };

  const shown = sortBag(rack.bag, weapons, order);
  const fresh = shown.filter(id => weapons.get(id)?.fresh);
  const grouped = order === 'newest' && fresh.length > 0;
  const earlier = grouped ? shown.filter(id => !weapons.get(id)?.fresh) : shown;

  const side = (
    weapon: MenuWeapon,
    caption: string,
    other: MenuWeapon | undefined,
  ) => (
    <CompareSide $muted={discarding && weapon.id === picked}>
      <Caption data-part="caption">
        {caption}
        {weapon.fresh && weapon.id === picked && <Tag>New</Tag>}
        {weapon.bossLoot && <Tag>Boss loot</Tag>}
      </Caption>
      <strong>{weapon.name}</strong>
      <span data-part="tag">
        <WeaponTag {...weapon} />
      </span>
      <span data-part="traits">{describeTraits(weapon)}</span>
      <StatList stats={weapon.stats} against={other?.stats} />
    </CompareSide>
  );

  const compare = (() => {
    if (!pickedWeapon || !picked)
      return (
        <p>
          Pick a weapon to see it beside the one it would replace, and hear them
          both.
          <PointerOnly $pointer="mouse">
            {' '}
            1-3 equips the pick, H plays it, Esc or B closes.
          </PointerOnly>
        </p>
      );
    const verb = pickedIn === 'bag' ? 'Equip in' : 'Move to';
    const pickLabel =
      pickedIn === 'slots' ? `Slot ${rack.slots.indexOf(picked) + 1}` : 'Pick';
    const againstLabel = against
      ? `Slot ${rack.slots.indexOf(against.id) + 1}`
      : '';
    /** One weapon as a track over the shared grid. */
    const rackRow = (weapon: MenuWeapon, label: string, other?: MenuWeapon) => (
      <RackRow $sounding={sounding(weapon.id)}>
        <span data-part="label">{label}</span>
        <span data-part="engine">
          <Icon icon={WEAPON_ICONS[weapon.oscillator]} />
        </span>
        <span data-part="name">{weapon.maker}</span>
        {stepsFor(weapon)}
        <span data-part="damage">
          {weapon.stats.perBar}
          {other && (
            <Tag $tone={verdictOf(weapon.stats, other.stats)}>
              {VERDICTS[verdictOf(weapon.stats, other.stats)]}
            </Tag>
          )}
        </span>
      </RackRow>
    );
    return (
      <>
        <div data-part="rack">
          <div data-part="rack-head">
            <Caption as="h3">Side by side</Caption>
            {against ? (
              <HearButton
                type="button"
                $wide
                $playing={abOn}
                aria-pressed={abOn}
                aria-label={
                  abOn
                    ? 'Stop the A/B'
                    : `A/B: hear the pick, then slot ${rack.slots.indexOf(against.id) + 1}, a bar each`
                }
                onClick={toggleAB}
              >
                <Icon icon={abOn ? STOP_ICON : PLAY_ICON} />
                A/B
              </HearButton>
            ) : (
              hearButton(pickedWeapon)
            )}
          </div>
          {rackRow(pickedWeapon, pickLabel, against)}
          {against && rackRow(against, againstLabel)}
        </div>
        {side(
          pickedWeapon,
          pickedIn === 'slots'
            ? `Slot ${rack.slots.indexOf(picked) + 1}`
            : 'From the bag',
          against,
        )}
        {against ? (
          side(
            against,
            targetSlot !== null
              ? `Replaces slot ${targetSlot + 1}`
              : `Swap with slot ${rack.slots.indexOf(against.id) + 1}`,
            undefined,
          )
        ) : (
          <CompareSide>
            <p>
              Pick a bag weapon to swap into this slot, or another slot to trade
              places.
            </p>
          </CompareSide>
        )}
        <PlaceRow>
          {discarding ? (
            <span>Marked to discard when you close the menu.</span>
          ) : (
            <>
              <span>{verb}</span>
              {rack.slots.map((id, index) =>
                id === picked ? null : (
                  <Button
                    key={id}
                    type="button"
                    $variant="quiet"
                    aria-label={`${verb} slot ${index + 1}`}
                    aria-pressed={targetSlot === index || aim === id}
                    onPointerEnter={() => setAim(id)}
                    onFocus={() => setAim(id)}
                    onClick={() => place(index)}
                  >
                    {index + 1}
                  </Button>
                ),
              )}
            </>
          )}
          <span data-part="spacer" />
          {pickedIn === 'bag' && (
            <Button
              type="button"
              $variant="quiet"
              onClick={() => setRack(toggleDiscard(rack, picked))}
            >
              {discarding ? 'Keep it' : 'Discard'}
            </Button>
          )}
        </PlaceRow>
      </>
    );
  })();

  return (
    <Scrim>
      <Sheet
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="loadout-heading"
        onKeyDown={onSheetKeyDown}
      >
        <Header>
          <div>
            <h2 id="loadout-heading">{heading}</h2>
            {note && <p>{note}</p>}
            {error && <p role="alert">{error}</p>}
            {confirming && (
              <p role="alert">
                Press Esc again to throw away {rack.discarded.length}{' '}
                {rack.discarded.length === 1 ? 'weapon' : 'weapons'}, or Undo
                changes to keep {rack.discarded.length === 1 ? 'it' : 'them'}.
              </p>
            )}
          </div>
          <div>
            {dirty && (
              <Button
                type="button"
                $variant="secondary"
                onClick={() => {
                  setRack(rackOf(opened));
                  setPicked(null);
                  setAim(null);
                  setConfirming(false);
                }}
              >
                Undo changes
              </Button>
            )}
            <Button
              type="button"
              aria-disabled={isApplying || undefined}
              onClick={done}
            >
              {isApplying
                ? 'Arming weapons…'
                : rack.discarded.length > 0
                  ? `${doneLabel} · discard ${rack.discarded.length}`
                  : doneLabel}
            </Button>
          </div>
        </Header>
        <Columns>
          <Column>
            <Section aria-labelledby="loadout-slots">
              <h3 id="loadout-slots">Equipped</h3>
              <SlotList data-group="slots">
                {rack.slots.map((id, slot) => {
                  const weapon = weapons.get(id);
                  if (!weapon) return null;
                  return (
                    <li key={id}>
                      <Card
                        data-card
                        ref={slot === 0 ? first : undefined}
                        type="button"
                        $keyed
                        $picked={picked === id}
                        $target={targetSlot === slot}
                        aria-pressed={picked === id}
                        aria-label={`Slot ${slot + 1}: ${weapon.name}${
                          targetSlot === slot ? ', the pick would go here' : ''
                        }`}
                        onClick={() => pick(id)}
                        onPointerEnter={() => setAim(id)}
                        onFocus={() => setAim(id)}
                      >
                        <PointerOnly $pointer="mouse">
                          <kbd>{slot + 1}</kbd>
                        </PointerOnly>
                        {trackOf(weapon)}
                      </Card>
                      {hearButton(weapon)}
                    </li>
                  );
                })}
              </SlotList>
            </Section>
            <Announce aria-live="polite">{announcement}</Announce>
            <Compare ref={compareRef} aria-label="Compare">
              {compare}
            </Compare>
          </Column>
          <Column>
            <Section aria-labelledby="loadout-bag">
              <SortRow>
                <h3 id="loadout-bag">
                  Bag {kept}/{bagSize}
                </h3>
                {rack.bag.length >= SORT_FROM && (
                  <SegmentedControl
                    label="Sort"
                    options={ORDERS}
                    value={order}
                    onChange={setOrder}
                  />
                )}
                {weaker.length > 0 && (
                  <Button
                    type="button"
                    $variant="quiet"
                    onClick={() => {
                      setRack(discardAll(rack, weaker));
                      setPicked(null);
                    }}
                  >
                    Discard weaker ({weaker.length})
                  </Button>
                )}
              </SortRow>
              {full && (
                <Empty>
                  Bag full: new drops wait on the floor until you equip or
                  discard one.
                </Empty>
              )}
              {shown.length === 0 && (
                <Empty>
                  Nothing in the bag yet. Weapons drop from kills and drift in
                  when you're near.
                </Empty>
              )}
              {grouped && (
                <>
                  <Caption as="h4">New · {fresh.length}</Caption>
                  <Shelf data-group="bag" aria-label="New weapons">
                    {fresh.map(bagCard)}
                  </Shelf>
                </>
              )}
              {earlier.length > 0 && (
                <>
                  {grouped && <Caption as="h4">Earlier</Caption>}
                  <Shelf
                    data-group="bag"
                    aria-label={grouped ? 'Earlier weapons' : 'Weapons'}
                  >
                    {earlier.map(bagCard)}
                  </Shelf>
                </>
              )}
            </Section>
          </Column>
        </Columns>
      </Sheet>
    </Scrim>
  );
};
