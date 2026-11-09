import type { Person } from '../types';

export const fmtYear = (y: number) => (y < 0 ? `${-y} BCE` : `${y} CE`);

function range(a?: number, b?: number) {
  if (a != null && b != null)
    return (a < 0) === (b < 0) ? `${Math.abs(a)}–${fmtYear(b)}` : `${fmtYear(a)} – ${fmtYear(b)}`;
  if (a != null) return `b. ${fmtYear(a)}`;
  if (b != null) return `d. ${fmtYear(b)}`;
  return '';
}

export function formatDates(p: Person) {
  const c = p.approx ? 'c. ' : '';
  if (p.reign) return `r. ${c}${range(p.reign[0], p.reign[1])}`;
  const r = range(p.born, p.died);
  return r ? c + r : '';
}