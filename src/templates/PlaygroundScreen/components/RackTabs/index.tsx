import { useRef, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import type { Rack } from '~/game/sound/racks';

const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  border-block-end: ${({ theme }) => theme.borderWidth('s')} solid
    ${({ theme }) => theme.color('formBackground', 'emphasis')};
`;

const Tab = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing('xxs')};
  min-block-size: 2.25rem;
  padding: 0 ${({ theme }) => theme.spacing('base')};
  border: ${({ theme }) => theme.borderWidth('s')} solid transparent;
  border-block-end: none;
  border-radius: ${({ theme }) => theme.borderRadius('s')}
    ${({ theme }) => theme.borderRadius('s')} 0 0;
  background: transparent;
  color: ${({ theme }) => theme.color('secondary')};
  font-family: ${({ theme }) => theme.fontFamily('mono')};
  font-size: ${({ theme }) => theme.fontSize('s')};
  font-weight: ${({ theme }) => theme.fontWeight('bold')};
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color('background', 'text')};
  }

  &[aria-selected='true'] {
    margin-block-end: -1px;
    border-color: ${({ theme }) => theme.color('formBackground', 'emphasis')};
    background: ${({ theme }) => theme.color('formBackground')};
    color: ${({ theme }) => theme.color('background', 'text')};
  }

  &:focus-visible {
    outline: ${({ theme }) => theme.borderWidth('base')} solid
      ${({ theme }) => theme.color('focus')};
    outline-offset: -2px;
  }
`;

/** The armed engine's rack carries an amber light. */
const Armed = styled.span`
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius('full')};
  background: ${({ theme }) => theme.color('quaternary')};
  box-shadow: 0 0 8px
    color-mix(
      in srgb,
      ${({ theme }) => theme.color('quaternary')} 55%,
      transparent
    );
`;

/** The rack strip: one tab per instrument, arrow keys between them. */
export const RackTabs = ({
  racks,
  active,
  armed,
  onSelect,
  tabId,
  panelId,
}: {
  racks: Array<Rack>;
  active: string;
  /** The rack of the engine being auditioned. */
  armed: string;
  onSelect: (id: string) => void;
  tabId: (id: string) => string;
  panelId: string;
}) => {
  const list = useRef<HTMLDivElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = racks.findIndex(rack => rack.id === active);
    const next = racks[(index + step + racks.length) % racks.length];
    onSelect(next.id);
    list.current
      ?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(next.id))}`)
      ?.focus();
  };

  return (
    <List
      ref={list}
      role="tablist"
      aria-label="Instruments"
      onKeyDown={onKeyDown}
    >
      {racks.map(rack => (
        <Tab
          key={rack.id}
          id={tabId(rack.id)}
          type="button"
          role="tab"
          aria-selected={rack.id === active}
          aria-controls={panelId}
          tabIndex={rack.id === active ? 0 : -1}
          onClick={() => onSelect(rack.id)}
        >
          {rack.label}
          {rack.id === armed && <Armed title="Armed" />}
        </Tab>
      ))}
    </List>
  );
};
