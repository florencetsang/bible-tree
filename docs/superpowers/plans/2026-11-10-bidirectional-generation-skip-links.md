# Bidirectional Generation-Skip Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generation-skip (`descendant`) relationship links count as parent links in the reverse direction, so ancestor highlighting walks the full chain (e.g. Abraham → Terah → Shem → … → Adam).

**Architecture:** `src/lib/graph.ts` indexes the relationship data into `parentsOf` / `childrenOf` / `spousesOf` maps. The fix adds the reverse direction for `descendant` links when building these maps. `highlightSet` already traverses transitively in both directions, so no change is needed there.

**Tech Stack:** TypeScript, Vite, Vitest (new dev dependency for this plan — no test runner exists yet; it is the standard companion for Vite and imports the existing JSON data and TS modules unchanged).

**Spec:** `docs/superpowers/specs/2026-11-10-bidirectional-generation-skip-links-design.md`

## Global Constraints

- Reversed skip links keep type `'descendant'` and the original `note` (spec: "keeping type `descendant` and its note").
- No changes to relationship data, edge styling, or node rendering (spec non-goals).
- Drawer family lists stay direct-only (spec decision).
- Existing tooling: `npm run lint` (oxlint), `npm run build` must stay green.

## Review Focus

- Chained skip links: a person whose ancestry crosses two skip links in a row must still walk through — covered by the Task 1 test asserting Enoch's ancestors include Seth (skip) and Adam (regular links beyond).
- Descendant direction unchanged: skip links must still appear as children — covered by the Task 1 test on `childrenOf`.
- Note preservation: the reversed link must carry the `note` (drawer shows "via …") — covered by the Task 1 test on the link object.
- Duplicate suppression: a person already reachable via a regular `parent` link must not be double-added — `push` appends to a list, so duplicates would show twice in the drawer; the data currently has none, and the behavior is acceptable if one appears, so no code guard (call recorded here).
- Cycles in the data must not hang the highlight — `highlightSet`'s visited-set already prevents this; verified by the full-data ancestor test terminating.

---

### Task 1: Reverse generation-skip links in the lineage maps

**Files:**
- Modify: `src/lib/graph.ts` (~lines 33-38, the `else if (r.type === 'descendant')` branch)
- Create: `src/lib/graph.test.ts`
- Modify: `package.json` (devDependency + `test` script)

**Interfaces:**
- Consumes: existing `parentsOf: Map<string, Link[]>`, `childrenOf: Map<string, Link[]>`, `highlightSet(selectedId: string | null, mode: HighlightMode): Set<string> | null` in `src/lib/graph.ts`.
- Produces: unchanged public surface — behavior change only. `parentsOf` now contains `descendant`-typed links pointing at the *ancestor* end of a skip link.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Then add `"test": "vitest run"` to the `scripts` in `package.json`.

- [ ] **Step 2: Write the failing tests**

Create `src/lib/graph.test.ts` with tests asserting, against the real data in `src/data/*.json`:

```ts
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

  it('descendant highlighting is unchanged across a skip link', () => {
    const lit = highlightSet('adam', 'descendants');
    expect(lit!.has('enoch')).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: the three ancestor-walk/parents assertions FAIL (`shem` link missing); the two children/descendants assertions PASS.

- [ ] **Step 4: Implement the reverse link in `src/lib/graph.ts`**

In the relationship indexing loop, in the `else if (r.type === 'descendant')` branch: alongside the existing `push(childrenOf, r.from, …)`, also `push(parentsOf, r.to, { id: r.from, type: r.type, note: r.note })` — so the skip-link ancestor becomes a parent link of the skip-link descendant. Update the branch comment, which currently says "never an ancestor link".

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all 5 tests PASS.

- [ ] **Step 6: Run lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed with no new warnings/errors.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/graph.ts src/lib/graph.test.ts
git commit -m "feat: count generation-skip links as ancestor links both ways"
```
