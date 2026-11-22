import { useId, useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  NAME_MAX,
  nameProblem,
  normalizeName,
  passwordProblem,
} from '~/utils/playerName';
import { Buttons } from './components/Buttons';
import { Field } from './components/Field';
import { Form } from './components/Form';
import { Problem } from './components/Problem';

export interface EnterFormProps {
  /** What pressing the button does, e.g. "Save to the board". */
  submitLabel: string;
  /** The button while it's under way; "Saving…" unless given. */
  submittingLabel?: string;
  isSubmitting: boolean;
  /** Why the last try failed, from the server. */
  error: string | null;
  onSubmit: (credentials: { name: string; password: string }) => void;
  /** Leave without signing in; omitted, there's no Skip. */
  onSkip?: () => void;
  /** The way out's label; "Skip" unless given. */
  skipLabel?: string;
}

/** Signing in, as a screen showing this form gets it. */
export interface SignInState {
  isEntering: boolean;
  /** Why the last try failed, from the server. */
  error: string | null;
  onEnter: (credentials: { name: string; password: string }) => void;
}

/** Signing out, as a screen offering it gets it. */
export interface SignOutState {
  isSigningOut: boolean;
  /** The last try didn't go through (offline, say); they're still in. */
  signOutFailed: boolean;
  onSignOut: () => void;
}

export const signOutLabel = ({ isSigningOut, signOutFailed }: SignOutState) => {
  if (isSigningOut) return 'Signing out…';
  return signOutFailed ? "Couldn't sign out, try again" : 'Sign out';
};

/**
 * One form for a new name and a returning one: a free name is claimed
 * with the password, a taken one signs in with it.
 */
export const EnterForm = ({
  submitLabel,
  submittingLabel = 'Saving…',
  isSubmitting,
  error,
  onSubmit,
  onSkip,
  skipLabel = 'Skip',
}: EnterFormProps) => {
  const id = useId();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState(false);
  const normalized = normalizeName(name);
  const problems = {
    name: checked ? nameProblem(normalized) : null,
    password: checked ? passwordProblem(password) : null,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setChecked(true);
    if (isSubmitting) return;
    if (nameProblem(normalized) || passwordProblem(password)) return;
    onSubmit({ name: normalized, password });
  };

  return (
    <Form
      onSubmit={submit}
      noValidate
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <Field>
        Name, {NAME_MAX} letters at most
        <TextInput
          value={name}
          onChange={event => setName(event.target.value)}
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={NAME_MAX}
          $invalid={Boolean(problems.name)}
          aria-invalid={Boolean(problems.name)}
        />
        {problems.name && <Problem>{problems.name}</Problem>}
      </Field>
      <Field>
        Password, new or your own
        <TextInput
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoComplete="current-password"
          $invalid={Boolean(problems.password)}
          aria-invalid={Boolean(problems.password)}
        />
        {problems.password && <Problem>{problems.password}</Problem>}
      </Field>
      {error && (
        <Problem id={`${id}-error`} role="alert">
          {error}
        </Problem>
      )}
      <Buttons>
        <Button type="submit" $variant="quiet" aria-disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
        {onSkip && (
          <Button type="button" $variant="quiet" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
      </Buttons>
    </Form>
  );
};
