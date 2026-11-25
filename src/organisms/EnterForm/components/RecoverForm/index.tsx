import { useId, useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  NAME_MAX,
  nameProblem,
  normalizeName,
  passwordProblem,
} from '~/utils/playerName';
import { codeProblem } from '~/utils/recoveryCode';
import { Buttons } from '../Buttons';
import { Field } from '../Field';
import { Form } from '../Form';
import { Problem } from '../Problem';

/** What a recovery sends: the name, its code, and the new password. */
export interface Recovery {
  name: string;
  code: string;
  password: string;
}

/** Getting back in with a recovery code, as a screen offering it gets it. */
export interface RecoverState {
  isRecovering: boolean;
  /** Why the last try failed, from the server. */
  error: string | null;
  onRecover: (recovery: Recovery) => void;
}

export interface RecoverFormProps extends RecoverState {
  /** Back to signing in with a password. */
  onCancel: () => void;
}

/** A lost password replaced: name, recovery code and a new password. */
export const RecoverForm = ({
  isRecovering,
  error,
  onRecover,
  onCancel,
}: RecoverFormProps) => {
  const id = useId();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState(false);
  const normalized = normalizeName(name);
  const problems = {
    name: checked ? nameProblem(normalized) : null,
    code: checked ? codeProblem(code) : null,
    password: checked ? passwordProblem(password) : null,
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setChecked(true);
    if (isRecovering) return;
    if (
      nameProblem(normalized) ||
      codeProblem(code) ||
      passwordProblem(password)
    )
      return;
    onRecover({ name: normalized, code, password });
  };

  return (
    <Form
      onSubmit={submit}
      noValidate
      aria-label="Reset your password"
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
        Recovery code
        <TextInput
          value={code}
          onChange={event => setCode(event.target.value)}
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          $invalid={Boolean(problems.code)}
          aria-invalid={Boolean(problems.code)}
        />
        {problems.code && <Problem>{problems.code}</Problem>}
      </Field>
      <Field>
        New password
        <TextInput
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          autoComplete="new-password"
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
        <Button type="submit" $variant="quiet" aria-disabled={isRecovering}>
          {isRecovering ? 'Resetting…' : 'Reset password'}
        </Button>
        <Button type="button" $variant="quiet" onClick={onCancel}>
          Back to sign in
        </Button>
      </Buttons>
    </Form>
  );
};
