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
  isSubmitting: boolean;
  /** Why the last try failed, from the server. */
  error: string | null;
  onSubmit: (credentials: { name: string; password: string }) => void;
  /** Leave without signing in; omitted, there's no Skip. */
  onSkip?: () => void;
}

/**
 * One form for a new name and a returning one: a free name is claimed
 * with the password, a taken one signs in with it.
 */
export const EnterForm = ({
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onSkip,
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
    <Form onSubmit={submit} noValidate aria-describedby={`${id}-error`}>
      <Field>
        Name, {NAME_MAX} letters at most
        <TextInput
          value={name}
          onChange={event => setName(event.target.value)}
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={NAME_MAX + 4}
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
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        {onSkip && (
          <Button type="button" $variant="quiet" onClick={onSkip}>
            Skip
          </Button>
        )}
      </Buttons>
    </Form>
  );
};
