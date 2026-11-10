import { describe, expect, it } from 'vitest';
import { childrenOf, highlightSet, parentsOf } from './graph';

describe('generation-skip links', () => {
  it('count the ancestor as a parent of the descendant', () => {
    const links = parentsOf.get('terah') ?? [];
    const shem = links.find((l) => l.id === 'shem');
    expect(shem?.type).toBe('descendant');
    expect(shem?.note).toContain('Arphaxad');
  });

  it('still count as children of the ancestor', () => {
    expect((childrenOf.get('shem') ?? []).some((l) => l.id === 'terah')).toBe(true);
  });

  it('walk ancestors across skip links to Adam', () => {
    const lit = highlightSet('abraham', 'ancestors');
    expect(lit).not.toBeNull();
    for (const id of ['terah', 'shem', 'noah', 'adam']) expect(lit!.has(id)).toBe(true);
  });

  it('walks ancestors from below a skip link', () => {
    const lit = highlightSet('enoch', 'ancestors');
    expect(lit!.has('seth')).toBe(true);
    expect(lit!.has('adam')).toBe(true);
  });

  it('walks ancestors across consecutive skip links (Joseph to Adam)', () => {
    const lit = highlightSet('joseph_nazareth', 'ancestors');
    // Zerubbabel, Josiah, Hezekiah, Rehoboam are four generation-skip links in a row
    for (const id of ['zerubbabel', 'josiah', 'hezekiah', 'rehoboam', 'david', 'adam']) {
      expect(lit!.has(id), id).toBe(true);
    }
  });

  it('descendant highlighting is unchanged across a skip link', () => {
    const lit = highlightSet('adam', 'descendants');
    expect(lit!.has('enoch')).toBe(true);
  });
});
