import { useState } from 'react';
import { TextLink } from '~/atoms/TextLink';
import {
  EnterForm,
  signOutLabel,
  type SignInState,
  type SignOutState,
} from '~/organisms/EnterForm';
import { SignIn } from '../SignIn';

export type StartAccount =
  | { kind: 'loading' }
  | ({ kind: 'signedOut' } & SignInState)
  | ({ kind: 'signedIn'; name: string } & SignOutState);

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
        <TextLink
          as="button"
          type="button"
          onClick={account.onSignOut}
          disabled={account.isSigningOut}
        >
          {signOutLabel(account)}
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
