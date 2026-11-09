import { create } from 'zustand';
import { personById } from './lib/graph';
import type { HighlightMode } from './types';

type State = {
  selectedId: string | null;
  highlight: HighlightMode;
  /** Set when the canvas should fly to a person (search, family links, deep links). */
  focus: { id: string; nonce: number } | null;
  select: (id: string | null, opts?: { focus?: boolean }) => void;
  setHighlight: (m: HighlightMode) => void;
};

const idFromHash = () => {
  const m = window.location.hash.match(/^#\/person\/([\w-]+)$/);
  return m && personById.has(m[1]) ? m[1] : null;
};

const initial = idFromHash();

export const useTree = create<State>()((set) => ({
  selectedId: initial,
  highlight: 'none',
  focus: initial ? { id: initial, nonce: 0 } : null,
  select: (id, opts) => {
    set((s) => ({
      selectedId: id,
      focus: id && opts?.focus ? { id, nonce: (s.focus?.nonce ?? 0) + 1 } : s.focus,
    }));
    if (idFromHash() !== id) {
      const url = id ? `#/person/${id}` : window.location.pathname + window.location.search;
      window.history.pushState(null, '', url);
    }
  },
  setHighlight: (highlight) => set({ highlight }),
}));

// Back/forward buttons and manually edited URLs
window.addEventListener('popstate', () => {
  const id = idFromHash();
  useTree.setState((s) => ({
    selectedId: id,
    focus: id ? { id, nonce: (s.focus?.nonce ?? 0) + 1 } : s.focus,
  }));
});