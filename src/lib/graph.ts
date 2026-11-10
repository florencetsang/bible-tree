import type { Edge, Node } from '@xyflow/react';
import peopleJson from '../data/people.json';
import relsJson from '../data/relationships.json';
import layoutJson from '../data/layout.json';
import annotationsJson from '../data/annotations.json';
import { LINEAGE } from '../theme';
import type { Annotation, HighlightMode, Layout, Lineage, Person, RelType, Relationship, TimelineAnnotation } from '../types';

// ---------- data ----------

export type Link = { id: string; type: RelType; note?: string };

export const people = peopleJson as unknown as Person[];
export const relationships = relsJson as unknown as Relationship[];
const layout = layoutJson as unknown as Layout;
const annotations = annotationsJson as unknown as Annotation[];

export const personById = new Map(people.map((p) => [p.id, p]));

const push = (m: Map<string, Link[]>, key: string, link: Link) => {
  const arr = m.get(key);
  if (arr) arr.push(link);
  else m.set(key, [link]);
};

/** Direct parents (blood or adoptive), for "Parents & ancestors". */
export const parentsOf = new Map<string, Link[]>();
/** Direct children and line-continuation links, for "Children & descendants". */
export const childrenOf = new Map<string, Link[]>();
/** Spouses and partners (symmetric). */
export const spousesOf = new Map<string, Link[]>();

for (const r of relationships) {
  if (r.type === 'parent' || r.type === 'adoptive') {
    push(parentsOf, r.to, { id: r.from, type: r.type, note: r.note });
    push(childrenOf, r.from, { id: r.to, type: r.type, note: r.note });
  } else if (r.type === 'descendant') {
    // "line continues through unlisted generations": child link, and the ancestor
    // is a parent link of the descendant (type kept so the drawer can show "via …")
    push(childrenOf, r.from, { id: r.to, type: r.type, note: r.note });
    push(parentsOf, r.to, { id: r.from, type: r.type, note: r.note });
  } else {
    push(spousesOf, r.from, { id: r.to, type: r.type, note: r.note });
    push(spousesOf, r.to, { id: r.from, type: r.type, note: r.note });
  }
}

/** Chronological markers for the side rails, top to bottom. */
export const timeline = annotations
  .filter((a): a is TimelineAnnotation => a.type === 'timeline')
  .sort((a, b) => a.y - b.y);

// ---------- flow node types ----------

export type PersonFlowNode = Node<{ person: Person; active: boolean; dimmed: boolean }, 'person'>;
export type BandFlowNode = Node<{ label: string; w: number }, 'band'>;
export type RegionFlowNode = Node<{ label: string; w: number; h: number }, 'region'>;
export type LabelFlowNode = Node<{ label: string; lineage?: Lineage }, 'label'>;
export type TreeNode = PersonFlowNode | BandFlowNode | RegionFlowNode | LabelFlowNode;

// ---------- graph construction ----------

/** Bands span the poster by default (x range of the layout is roughly 0–1900). */
const BAND_X = 950;
const BAND_W = 1900;

export function buildNodes(): TreeNode[] {
  const nodes: TreeNode[] = [];

  // Decorative nodes first so people render above them.
  for (const a of annotations) {
    if (a.type === 'band') {
      nodes.push({
        id: a.id,
        type: 'band',
        position: { x: a.x ?? BAND_X, y: a.y },
        data: { label: a.label, w: a.w ?? BAND_W },
      });
    } else if (a.type === 'region') {
      nodes.push({
        id: a.id,
        type: 'region',
        position: { x: a.x, y: a.y },
        data: { label: a.label, w: a.w, h: a.h },
      });
    } else if (a.type === 'label') {
      nodes.push({
        id: a.id,
        type: 'label',
        position: { x: a.x, y: a.y },
        data: { label: a.label, lineage: a.lineage },
      });
    }
  }

  for (const p of people) {
    const [x, y] = layout[p.id] ?? [0, 0];
    nodes.push({
      id: p.id,
      type: 'person',
      position: { x, y },
      data: { person: p, active: false, dimmed: false },
    });
  }

  return nodes;
}

/**
 * PersonNode exposes source handles Right/Bottom and target handles Left/Top,
 * so pick the pair that matches the relative layout positions.
 */
function handlesFor(from: string, to: string): Pick<Edge, 'sourceHandle' | 'targetHandle'> {
  const a = layout[from] ?? [0, 0];
  const b = layout[to] ?? [0, 0];
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  return Math.abs(dx) > Math.abs(dy) && dx > 0
    ? { sourceHandle: 'r', targetHandle: 'l' }
    : { sourceHandle: 'b', targetHandle: 't' };
}

export function buildEdges(): Edge[] {
  return relationships.map((r: Relationship): Edge => {
    const id = `e-${r.from}-${r.to}-${r.type}`;

    if (r.type === 'spouse' || r.type === 'partner') {
      return {
        id,
        source: r.from,
        target: r.to,
        ...handlesFor(r.from, r.to),
        className: 'spouse',
        style: { stroke: '#c8a470', strokeWidth: 1.4, strokeDasharray: '1 6', strokeLinecap: 'round' },
      };
    }

    const child = personById.get(r.to);
    return {
      id,
      source: r.from,
      target: r.to,
      ...handlesFor(r.from, r.to),
      className: `${child ? `tier-${child.tier}` : ''}${r.type === 'descendant' ? ' skipped' : ''}`.trim(),
      style: {
        stroke: child ? LINEAGE[child.lineage].ink : '#a2743f',
        strokeWidth: child?.tier === 1 ? 2.2 : child?.tier === 2 ? 1.8 : 1.2,
        ...(r.type === 'descendant' ? { strokeDasharray: '8 6' } : {}), // generations skipped
      },
    };
  });
}

// ---------- highlighting ----------

/** The selected person plus all their ancestors or descendants (blood/adoptive line). */
export function highlightSet(selectedId: string | null, mode: HighlightMode): Set<string> | null {
  if (!selectedId || mode === 'none') return null;

  const lit = new Set([selectedId]);
  const queue = [selectedId];
  const links = mode === 'ancestors' ? parentsOf : childrenOf;

  while (queue.length) {
    const cur = queue.pop()!;
    for (const l of links.get(cur) ?? []) {
      if (!lit.has(l.id)) {
        lit.add(l.id);
        queue.push(l.id);
      }
    }
  }
  return lit;
}
