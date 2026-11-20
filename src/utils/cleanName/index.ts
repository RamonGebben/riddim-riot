import {
  DataSet,
  englishDataset,
  englishRecommendedTransformers,
  parseRawPattern,
  RegExpMatcher,
} from 'obscenity';

/**
 * What English profanity lists miss for a board seen by everyone: hate
 * figures and symbols, and common Dutch insults.
 */
const EXTRA_WORDS = [
  'hitler',
  'nazi',
  'siegheil',
  'kanker',
  'kut',
  'hoer',
  'tering',
  'tyfus',
  'mongool',
  'flikker',
  'nikker',
  'neuk',
];

/**
 * Matched on the name as typed: the matcher collapses repeated letters
 * and reads digits as letters, so these would never reach it intact.
 */
const LITERAL = ['KKK', '1488'];

/** Everyday words that contain a listed one. */
const ALLOWED = ['cockpit', 'cocktail', 'peacock', 'hancock', 'shuttlecock'];

let matcher: RegExpMatcher | null = null;

// Built on first use: the word lists compile to a few hundred patterns.
const getMatcher = () => {
  if (matcher) return matcher;
  const dataset = EXTRA_WORDS.reduce(
    (set, word) =>
      set.addPhrase(phrase =>
        phrase
          .setMetadata({ originalWord: word })
          .addPattern(parseRawPattern(word)),
      ),
    new DataSet<{ originalWord: string }>().addAll(englishDataset),
  ).build();
  matcher = new RegExpMatcher({
    ...dataset,
    whitelistedTerms: [...(dataset.whitelistedTerms ?? []), ...ALLOWED],
    ...englishRecommendedTransformers,
  });
  return matcher;
};

/**
 * Whether a board name reads as profanity or hate, spelled out with
 * numbers for letters or broken up with underscores included.
 */
export const isOffensiveName = (name: string): boolean => {
  const joined = name.replaceAll('_', '');
  if (LITERAL.some(term => joined.toUpperCase().includes(term))) return true;
  const found = getMatcher();
  return found.hasMatch(name) || found.hasMatch(joined);
};
