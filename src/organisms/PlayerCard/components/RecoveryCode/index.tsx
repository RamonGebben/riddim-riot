import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { Alert } from './components/Alert';
import { Code } from './components/Code';
import { Section } from './components/Section';

/** Your recovery code: whether you have one, and a fresh one once. */
export interface RecoveryState {
  hasRecovery: boolean;
  /** A code just issued: shown this one time, since only its hash is kept. */
  freshCode: string | null;
  isIssuing: boolean;
  /** Why the last try failed. */
  error: string | null;
  onIssue: () => void;
}

const COPY_LABELS = {
  idle: 'Copy code',
  copied: 'Copied',
  failed: "Couldn't copy: write it down",
};

/**
 * The one way back in when a password is lost: accounts hold no email, so
 * the player keeps a code instead.
 */
export const RecoveryCode = ({
  hasRecovery,
  freshCode,
  isIssuing,
  error,
  onIssue,
}: RecoveryState) => {
  const [copy, setCopy] = useState<keyof typeof COPY_LABELS>('idle');
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
  };
  return (
    <Section aria-labelledby="recovery-heading">
      <h2 id="recovery-heading">Recovery code</h2>
      {freshCode ? (
        <>
          <p>
            Keep this somewhere safe. If you forget your password, it gets you
            back in, once. It won't be shown again.
          </p>
          <Code>{freshCode}</Code>
          <Button
            type="button"
            $variant="quiet"
            onClick={() => void copyCode(freshCode)}
          >
            {COPY_LABELS[copy]}
          </Button>
        </>
      ) : (
        <>
          <p>
            {hasRecovery
              ? 'You have a recovery code. Lost it? A new one replaces it.'
              : "No recovery code yet. Without one, a forgotten password can't be reset."}
          </p>
          <Button
            type="button"
            $variant={hasRecovery ? 'quiet' : undefined}
            aria-disabled={isIssuing || undefined}
            onClick={() => {
              if (!isIssuing) onIssue();
            }}
          >
            {isIssuing
              ? 'Making a code…'
              : hasRecovery
                ? 'Get a new code'
                : 'Get a recovery code'}
          </Button>
        </>
      )}
      {error && <Alert role="alert">{error}</Alert>}
    </Section>
  );
};
