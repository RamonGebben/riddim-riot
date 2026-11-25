import { createHash, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  normalizeCode,
} from '~/utils/recoveryCode';

export const SESSION_COOKIE = 'bw_session';
const SESSION_DAYS = 180;
export const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export const hashPassword = (password: string) => hash(password);

export const verifyPassword = (passwordHash: string, password: string) =>
  verify(passwordHash, password).catch(() => false);

/** A fresh session token for the cookie; only its hash is stored. */
export const newSessionToken = () => randomBytes(32).toString('base64url');

export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/**
 * A fresh recovery code: each byte picks one of 32 characters, and 256 is
 * a multiple of 32, so every character is equally likely.
 */
export const newRecoveryCode = () =>
  [...randomBytes(CODE_LENGTH)]
    .map(byte => CODE_ALPHABET[byte % CODE_ALPHABET.length])
    .join('');

/** What's stored of a code: the hash of its normalized form. */
export const hashRecoveryCode = (code: string) =>
  hashToken(normalizeCode(code));

export const readCookie = (header: string | null, name: string) =>
  header
    ?.split(';')
    .map(part => part.trim().split('='))
    .find(([key]) => key === name)?.[1] ?? null;

export const sessionCookie = (token: string | null) =>
  [
    `${SESSION_COOKIE}=${token ?? ''}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${token ? SESSION_MS / 1000 : 0}`,
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
  ].join('; ');

/** The caller's address as Vercel forwards it. */
export const clientAddress = (headers: Headers) =>
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  headers.get('x-real-ip') ??
  'unknown';
