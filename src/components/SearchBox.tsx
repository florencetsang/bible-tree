import { useState } from 'react';
import { people } from '../lib/graph';
import { useTree } from '../store';

const options = people.flatMap((p) => [p.name, ...(p.aliases ?? [])].map((label) => ({ label, id: p.id })));
const find = (q: string) => options.find((o) => o.label.toLowerCase() === q.trim().toLowerCase());

export function SearchBox() {
  const select = useTree((s) => s.select);
  const [q, setQ] = useState('');

  const go = (hit = find(q)) => {
    if (!hit) return;
    select(hit.id, { focus: true });
    setQ('');
  };

  return (
    <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); go(); }}>
      <input
        list="people-options"
        value={q}
        placeholder="Search people…"
        aria-label="Search people"
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          const hit = find(v);
          // Jump straight away only if unambiguous ("Joseph" waits; "Joseph of Nazareth" exists)
          const ambiguous = options.some((o) => o !== hit && o.label.toLowerCase().startsWith(v.trim().toLowerCase()));
          if (hit && !ambiguous) go(hit);
        }}
      />
      <datalist id="people-options">
        {options.map((o) => <option key={`${o.id}:${o.label}`} value={o.label} />)}
      </datalist>
    </form>
  );
}