import { useState } from 'react';
import { TextLink } from '~/atoms/TextLink';
import { EnterForm } from '~/organisms/EnterForm';
import { SignIn } from '../SignIn';

export type StartAccount =
  | { kind: 'loading' }
  | {
      kind: 'signedOut';
      isEntering: boolean;
      /** Why the last try failed, from the server. */
      error: string | null;
      onEnter: (credentials: { name: string; password: string }) => void;
    }
  | { kind: 'signedIn'; name: string; onSignOut: () => void };

/**
 * Who's playing. Signed out, a link opens the sign-in form (it goes once
 * they're in); signed in, their name and a way out.
 */
export const Account = ({ account }: { account: StartAccount }) => {
  const [isOpen, setOpen] = useState(false);
  if (account.kind === 'loading') return null;
  if (account.kind === 'signedIn')
    return (
      <p>
        Playing as <strong>{account.name}</strong> ·{' '}
        <TextLink as="button" type="button" onClick={account.onSignOut}>
          Sign out
        </TextLink>
      </p>
    );
  if (!isOpen)
    return (
      <TextLink as="button" type="button" onClick={() => setOpen(true)}>
        Sign in to count every run
      </TextLink>
    );
  return (
    <SignIn>
      <p>
        Every run you finish goes on the board, and your loadout follows you to
        any device. A new name is yours with the password you pick.
      </p>
      <EnterForm
        submitLabel="Sign in"
        submittingLabel="Signing in…"
        isSubmitting={account.isEntering}
        error={account.error}
        onSubmit={account.onEnter}
        onSkip={() => setOpen(false)}
        skipLabel="Cancel"
      />
    </SignIn>
  );
};
