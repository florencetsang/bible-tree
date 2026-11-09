import type { CSSProperties } from 'react';
import type { Lineage } from './types';

export const LINEAGE: Record<Lineage, { label: string; color: string; ink: string }> = {
  core:     { label: 'Patriarchs & key figures', color: '#e8735a', ink: '#b8452e' },
  levi:     { label: 'Levi (priests)',           color: '#e3b63a', ink: '#9a7208' },
  judah:    { label: 'Judah (royal line)',       color: '#8790d4', ink: '#4b55a0' },
  israel:   { label: 'Israel & other tribes',    color: '#aca643', ink: '#6f6a17' },
  herodian: { label: 'Herodian dynasty',         color: '#de62a6', ink: '#a32b6c' },
  messiah:  { label: 'Jesus',                    color: '#f0b429', ink: '#9c6b00' },
};

/** CSS custom properties so every component can use var(--c) / var(--ci). */
export const lineageVars = (l: Lineage) =>
  ({ '--c': LINEAGE[l].color, '--ci': LINEAGE[l].ink }) as CSSProperties;