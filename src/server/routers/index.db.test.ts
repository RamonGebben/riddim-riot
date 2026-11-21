import { randomUUID } from 'node:crypto';
import { Pool } from '@neondatabase/serverless';
import { afterAll, describe, expect, it } from 'vitest';
import { appRouter } from '.';
import { createContext } from '../trpc';

// The routers against the real database (`pnpm test:db`).

const tag = randomUUID().replaceAll('-', '').slice(0, 7).toUpperCase();
const NAME = `T_${tag}`;
const PASSWORD = 'correct horse';
const address = `test-${tag}`;

/** A caller as a browser would be: with whatever cookie it was given. */
const browser = () => {
  let cookie = '';
  const call = async () => {
    const resHeaders = new Headers();
    const req = new Request('http://localhost/api/trpc', {
      headers: { cookie, 'x-forwarded-for': address },
    });
    const caller = appRouter.createCaller(
      createContext({ req, resHeaders, info: {} as never }),
    );
    return { caller, resHeaders };
  };
  return {
    async run<T>(
      work: (caller: Awaited<ReturnType<typeof call>>['caller']) => Promise<T>,
    ) {
      const { caller, resHeaders } = await call();
      const result = await work(caller);
      const set = resHeaders.get('set-cookie');
      if (set) cookie = set.split(';')[0];
      return result;
    },
  };
};

const code = async (work: Promise<unknown>) =>
  work.then(
    () => null,
    (error: { code?: string }) => error.code ?? String(error),
  );

afterAll(async () => {
  const owner = new Pool({ connectionString: process.env.DATABASE_URL });
  await owner.query(`delete from public.players where name like $1`, [
    `T_${tag}%`,
  ]);
  await owner.query(`delete from private.login_failures where key like $1`, [
    `%${address}`,
  ]);
  await owner.end();
});

describe('accounts', () => {
  const player = browser();

  it('claims a free name and signs in', async () => {
    const entered = await player.run(caller =>
      caller.account.enter({ name: NAME.toLowerCase(), password: PASSWORD }),
    );
    expect(entered).toEqual({ name: NAME, created: true });
    const me = await player.run(caller => caller.account.me());
    expect(me).toMatchObject({ name: NAME, totalPoints: 0, rank: null });
  });

  it('signs back in with the password, and refuses a wrong one', async () => {
    const stranger = browser();
    expect(
      await code(
        stranger.run(caller =>
          caller.account.enter({ name: NAME, password: 'wrong password' }),
        ),
      ),
    ).toBe('UNAUTHORIZED');
    expect(
      await stranger.run(caller =>
        caller.account.enter({ name: NAME, password: PASSWORD }),
      ),
    ).toEqual({ name: NAME, created: false });
  });

  it('stops guessing after five wrong passwords', async () => {
    const guesser = browser();
    // One wrong try is already counted from the test above.
    const tries = await Array.from({ length: 5 }).reduce<
      Promise<Array<string | null>>
    >(
      async done => [
        ...(await done),
        await code(
          guesser.run(caller =>
            caller.account.enter({ name: NAME, password: 'still wrong' }),
          ),
        ),
      ],
      Promise.resolve([]),
    );
    expect(tries.at(-1)).toBe('TOO_MANY_REQUESTS');
  });

  it('refuses an offensive name', async () => {
    expect(
      await code(
        browser().run(caller =>
          caller.account.enter({ name: 'f_u_c_k', password: PASSWORD }),
        ),
      ),
    ).toBe('BAD_REQUEST');
  });

  it('rejects a name with symbols', async () => {
    expect(
      await code(
        browser().run(caller =>
          caller.account.enter({ name: 'NO!PE', password: PASSWORD }),
        ),
      ),
    ).toBe('BAD_REQUEST');
  });
});

describe('runs', () => {
  const player = browser();
  const report = {
    score: 0,
    level: 1,
    kills: 0,
    seed: 42,
    outcome: 'died' as const,
  };

  it('needs a sign-in to save', async () => {
    const { ticket } = await player.run(caller => caller.runs.start());
    expect(
      await code(
        player.run(caller => caller.runs.submit({ ticket, ...report })),
      ),
    ).toBe('UNAUTHORIZED');
  });

  it('saves a death once, however often it is sent', async () => {
    await player.run(caller =>
      caller.account.enter({ name: `${NAME}R`, password: PASSWORD }),
    );
    const { ticket } = await player.run(caller => caller.runs.start());
    const first = await player.run(caller =>
      caller.runs.submit({ ticket, ...report }),
    );
    const again = await player.run(caller =>
      caller.runs.submit({ ticket, ...report }),
    );
    expect(first.after.total).toBe(0);
    expect(again.after).toEqual(first.after);
    const me = await player.run(caller => caller.account.me());
    expect(me?.runsCount).toBe(1);
    expect(me?.bestRuns).toHaveLength(1);
  });

  it('ranks a run that scores, and shows the rows around it', async () => {
    const { ticket } = await player.run(caller => caller.runs.start());
    const saved = await player.run(caller =>
      caller.runs.submit({ ...report, ticket, score: 300, kills: 2 }),
    );
    expect(saved.before).toEqual({ rank: null, total: 0 });
    expect(saved.after.total).toBe(300);
    expect(saved.after.rank).toBeGreaterThan(0);
    expect(saved.rows.map(row => row.name)).toContain(`${NAME}R`);
  });

  it('refuses a forged ticket and an impossible score', async () => {
    const { ticket } = await player.run(caller => caller.runs.start());
    const [runId, start, signature] = ticket.split('.');
    const earlier = `${runId}.${Number(start) - 60 * 60 * 1000}.${signature}`;
    expect(
      await code(
        player.run(caller =>
          caller.runs.submit({ ...report, ticket: earlier }),
        ),
      ),
    ).toBe('BAD_REQUEST');
    expect(
      await code(
        player.run(caller =>
          caller.runs.submit({ ...report, ticket, level: 3 }),
        ),
      ),
    ).toBe('BAD_REQUEST');
  });

  it('shows the board, and a player by name', async () => {
    const board = await player.run(caller => caller.board.top());
    expect(board.ranked).toBeGreaterThanOrEqual(0);
    const standing = await player.run(caller =>
      caller.board.player({ name: `${NAME}r` }),
    );
    expect(standing).toMatchObject({ name: `${NAME}R`, runsCount: 2 });
    expect(
      await player.run(caller => caller.board.player({ name: 'NO_SUCH_ONE' })),
    ).toBeNull();
  });
});

describe('loadout', () => {
  const player = browser();
  const recipes = [
    { seed: 11, oscillator: 'wobble' as const },
    { seed: 12, manufacturer: 'vandal' as const, fx: 'echo' as const },
    { seed: 13 },
  ];

  it('has no account to keep one on before signing in', async () => {
    expect(await player.run(caller => caller.loadout.mine())).toBeNull();
    expect(
      await code(player.run(caller => caller.loadout.save({ recipes }))),
    ).toBe('UNAUTHORIZED');
  });

  it('keeps the latest loadout on the account', async () => {
    await player.run(caller =>
      caller.account.enter({ name: `${NAME}L`, password: PASSWORD }),
    );
    expect(await player.run(caller => caller.loadout.mine())).toBeNull();
    await player.run(caller => caller.loadout.save({ recipes }));
    const swapped = [recipes[2], recipes[0], recipes[1]];
    await player.run(caller => caller.loadout.save({ recipes: swapped }));
    expect(await player.run(caller => caller.loadout.mine())).toEqual({
      recipes: swapped,
      savedAt: expect.any(Number),
    });
  });

  it('refuses a loadout that is no weapons', async () => {
    expect(
      await code(
        player.run(caller =>
          caller.loadout.save({ recipes: recipes.slice(0, 2) }),
        ),
      ),
    ).toBe('BAD_REQUEST');
    expect(
      await code(
        player.run(caller =>
          caller.loadout.save({
            recipes: [{ seed: -1 }, { seed: 2 }, { seed: 3 }],
          }),
        ),
      ),
    ).toBe('BAD_REQUEST');
  });
});
