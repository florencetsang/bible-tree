# Bidirectional generation-skip links — design

Approved 2026-11-10.

## Intent

If A is B's descendant, then B should be A's ancestor. Today, generation-skip
(`descendant` type) links count only as a child link, never as a parent link,
so the ancestor walk stops at the first skipped generation. Selecting Abraham
and pressing "Ancestors" lights up Terah but never reaches Shem, Noah, or
Adam — because Shem → Terah is a `descendant` link and Terah therefore has no
recorded parent.

## Goals

- "Ancestors" highlighting walks the full chain across generation-skip links
  (Abraham → Terah → Shem → … → Adam).
- "Descendants" highlighting keeps working as it does today (it was already
  transitive).
- The "generations skipped" meaning of these links stays visible: dashed
  canvas edges and the ⋯ "via …" notes in the drawer are unchanged.

## Non-goals

- No changes to the relationship data itself (no rewriting `descendant` links
  as `parent` links).
- No changes to edge styling or node rendering.
- The drawer's "Parents & ancestors" / "Children & descendants" lists stay
  direct relations only; the full chain is the canvas highlight's job.

## Approach

In `src/lib/graph.ts`, where relationships are indexed into `parentsOf` /
`childrenOf`: a `descendant` link `A → B` currently adds B to A's children
only. It will also add A to B's parents, keeping type `descendant` and the
note (so the drawer shows "⋯ Shem, via Arphaxad, Shelah, …").

Alternative considered: rewrite the data with plain `parent` links. Rejected —
it loses the generation-skip semantics (dashed edges, ⋯ markers).

`highlightSet` already walks chains transitively in both directions, so the
new reverse link is all that's needed for the fix.

## Decisions

- Drawer family lists remain direct-only (design call, approved).
- Reversed skip links keep type `descendant` and their note.
