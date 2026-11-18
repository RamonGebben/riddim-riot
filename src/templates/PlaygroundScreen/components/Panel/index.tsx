import type { ReactNode } from 'react';
import { Frame } from './components/Frame';
import { Heading } from './components/Heading';

/** A titled box of controls, named for assistive tech by its title. */
export const Panel = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  return (
    <Frame aria-label={title}>
      <Heading>{title}</Heading>
      {children}
    </Frame>
  );
};
