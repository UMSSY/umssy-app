import { describe, expect, it } from 'vitest';
import { normalizeTerm } from '../utils/normalize-term.js';
import { removeStopwords } from '../utils/remove-stopwords.js';
import { splitSegments } from '../utils/split-segments.js';
import { toContentWords } from '../utils/to-content-words.js';
import { tokenizeText } from '../utils/tokenize-text.js';

const words = (text: string) => tokenizeText(text).map((token) => token.value);

describe('normalizeTerm', () => {
  it('removes accents, lowers the case and collapses spaces', () => {
    expect(normalizeTerm('  Programación   en ÁREA  ')).toBe('programacion en area');
  });

  it('keeps technical symbols', () => {
    expect(normalizeTerm('C++')).toBe('c++');
    expect(normalizeTerm('C#')).toBe('c#');
    expect(normalizeTerm('Node.js')).toBe('node.js');
  });

  it('accepts a missing value', () => {
    expect(normalizeTerm(undefined as unknown as string)).toBe('');
  });
});

describe('tokenizeText', () => {
  it('keeps C++, C#, .NET and Node.js as single words', () => {
    expect(words('Usé C++, C#, .NET y Node.js.')).toEqual(['use', 'c++', ',', 'c#', ',', '.net', 'y', 'node.js', '.']);
  });

  it('turns a sentence period into a boundary without losing the word', () => {
    expect(tokenizeText('Trabajé con Java. Luego Python')).toEqual([
      { value: 'trabaje', isBoundary: false },
      { value: 'con', isBoundary: false },
      { value: 'java', isBoundary: false },
      { value: '.', isBoundary: true },
      { value: 'luego', isBoundary: false },
      { value: 'python', isBoundary: false },
    ]);
  });

  it('splits words joined by a slash and keeps hyphenated words', () => {
    expect(words('CI/CD y go-live')).toEqual(['ci', 'cd', 'y', 'go-live']);
  });

  it('treats punctuation and line breaks as boundaries', () => {
    const tokens = tokenizeText('Java;\nPython (Django)');
    expect(tokens.filter((token) => token.isBoundary).map((token) => token.value)).toEqual([';', '\n', '(', ')']);
  });

  it('normalizes Unicode forms before tokenizing', () => {
    expect(words('Programación')).toEqual(words('Programación'));
    expect(words('PROGRAMACIÓN')).toEqual(['programacion']);
  });

  it('returns no tokens for empty or missing text', () => {
    expect(tokenizeText('')).toEqual([]);
    expect(tokenizeText(null as unknown as string)).toEqual([]);
    expect(tokenizeText('  ... ')).toEqual([{ value: '.', isBoundary: true }, { value: '.', isBoundary: true }, { value: '.', isBoundary: true }]);
  });
});

describe('removeStopwords', () => {
  it('removes Spanish stopwords but keeps negations and boundaries', () => {
    const tokens = removeStopwords(tokenizeText('No uso la base de datos, sin embargo uso Java'));
    expect(tokens.map((token) => token.value)).toEqual(['no', 'uso', 'base', 'datos', ',', 'sin', 'embargo', 'uso', 'java']);
  });
});

describe('toContentWords', () => {
  it('returns the meaningful words of a phrase', () => {
    expect(toContentWords('pruebas de penetración')).toEqual(['pruebas', 'penetracion']);
    expect(toContentWords('de la')).toEqual([]);
  });
});

describe('splitSegments', () => {
  it('cuts the words at every boundary', () => {
    expect(splitSegments(tokenizeText('Spring. Boot, React'))).toEqual([['spring'], ['boot'], ['react']]);
    expect(splitSegments(tokenizeText('...'))).toEqual([]);
  });
});
