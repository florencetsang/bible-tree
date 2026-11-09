export type Lineage = 'core' | 'levi' | 'judah' | 'israel' | 'herodian' | 'messiah';
export type Tier = 1 | 2 | 3;
export type HighlightMode = 'none' | 'ancestors' | 'descendants';

export type Reference = { ref: string; label: string };

export type Person = {
  id: string;
  name: string;
  aliases?: string[];
  meaning?: string;
  lineage: Lineage;
  tier: Tier;
  born?: number; // negative = BCE
  died?: number;
  reign?: [number, number];
  approx?: boolean;
  summary: string;
  portrait?: string; // e.g. "/portraits/abraham.jpg" (put files in /public/portraits)
  references: Reference[];
};

export type RelType = 'parent' | 'adoptive' | 'spouse' | 'partner' | 'descendant';
export type Relationship = { from: string; to: string; type: RelType; note?: string };

export type Layout = Record<string, [number, number]>;

export type Annotation =
  | { type: 'band'; id: string; label: string; y: number; x?: number; w?: number }
  | { type: 'region'; id: string; label: string; x: number; y: number; w: number; h: number }
  | { type: 'label'; id: string; label: string; x: number; y: number; lineage?: Lineage }
  | { type: 'timeline'; id: string; side: 'biblical' | 'secular'; label: string; date?: string; y: number };

export type TimelineAnnotation = Extract<Annotation, { type: 'timeline' }>;