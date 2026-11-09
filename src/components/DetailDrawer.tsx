import { useEffect, useState } from 'react';
import { childrenOf, parentsOf, personById, spousesOf, type Link } from '../lib/graph';
import { formatDates } from '../lib/format';
import { fetchPassage, gatewayUrl, type Passage } from '../lib/bible';
import { LINEAGE, lineageVars } from '../theme';
import { useTree } from '../store';
import { Avatar } from './PersonNode';
import type { HighlightMode, Person, Reference } from '../types';

const MODES: [HighlightMode, string][] = [
  ['none', 'Off'],
  ['ancestors', 'Ancestors'],
  ['descendants', 'Descendants'],
];

export function DetailDrawer() {
  const selectedId = useTree((s) => s.selectedId);
  const select = useTree((s) => s.select);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  const person = selectedId ? personById.get(selectedId) : undefined;
  if (!person) return null;
  return <DrawerContent key={person.id} person={person} />; // key resets passage state per person
}

function DrawerContent({ person: p }: { person: Person }) {
  const select = useTree((s) => s.select);
  const highlight = useTree((s) => s.highlight);
  const setHighlight = useTree((s) => s.setHighlight);
  const dates = formatDates(p);

  return (
    <aside className="drawer" style={lineageVars(p.lineage)} aria-labelledby="drawer-title">
      <button className="drawer-close" onClick={() => select(null)} aria-label="Close details">×</button>

      <header className="drawer-head">
        <Avatar person={p} size={72} />
        <div>
          <div className="drawer-lineage">{LINEAGE[p.lineage].label}</div>
          <h2 id="drawer-title">{p.name}</h2>
          {p.aliases?.length ? <div className="muted">also {p.aliases.join(', ')}</div> : null}
          {p.meaning && <div className="muted">“{p.meaning}”</div>}
          {dates && <div className="drawer-dates">{dates}</div>}
        </div>
      </header>

      <p className="summary">{p.summary}</p>

      <div className="seg" role="group" aria-label="Highlight on tree">
        {MODES.map(([m, label]) => (
          <button key={m} aria-pressed={highlight === m} onClick={() => setHighlight(m)}>{label}</button>
        ))}
      </div>

      <section>
        <h3>Family</h3>
        <FamilyGroup title="Parents & ancestors" links={parentsOf.get(p.id) ?? []} />
        <FamilyGroup title="Spouses" links={spousesOf.get(p.id) ?? []} />
        <FamilyGroup title="Children & descendants" links={childrenOf.get(p.id) ?? []} />
      </section>

      <section>
        <h3>Key passages</h3>
        {p.references.map((r) => <PassagePreview key={r.ref} reference={r} />)}
      </section>

      <footer className="muted small">
        Dates follow a traditional (Ussher-style) chronology and are approximate. Scripture: World English
        Bible (public domain) via bible-api.com.
      </footer>
    </aside>
  );
}

function FamilyGroup({ title, links }: { title: string; links: Link[] }) {
  const select = useTree((s) => s.select);
  if (!links.length) return null;
  return (
    <div className="family-group">
      <h4>{title}</h4>
      <ul>
        {links.map((l) => {
          const q = personById.get(l.id);
          if (!q) return null;
          return (
            <li key={l.id}>
              <button className="chip" style={lineageVars(q.lineage)} onClick={() => select(q.id, { focus: true })}>
                {l.type === 'descendant' && '⋯ '}
                {q.name}
                {l.type === 'adoptive' && ' (legal)'}
              </button>
              {l.note && <small>{l.type === 'descendant' ? `via ${l.note}` : l.note}</small>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; passage: Passage }
  | { status: 'error'; message: string };

function PassagePreview({ reference }: { reference: Reference }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && (state.status === 'idle' || state.status === 'error')) {
      setState({ status: 'loading' });
      fetchPassage(reference.ref)
        .then((passage) => setState({ status: 'ok', passage }))
        .catch((e: Error) => setState({ status: 'error', message: e.message }));
    }
  };

  return (
    <div className="passage">
      <button className="passage-head" aria-expanded={open} onClick={toggle}>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span>{reference.label}</span>
        <span className="ref">{reference.ref}</span>
      </button>
      {open && (
        <div className="passage-body">
          {state.status === 'loading' && <p className="muted">Loading…</p>}
          {state.status === 'error' && <p className="muted">{state.message}</p>}
          {state.status === 'ok' && (
            <>
              {state.passage.verses.map((v) => (
                <p key={`${v.chapter}:${v.verse}`}><sup>{v.verse}</sup>{v.text}</p>
              ))}
              <p className="muted small">{state.passage.translation}</p>
            </>
          )}
          <a href={gatewayUrl(reference.ref)} target="_blank" rel="noreferrer">Read in context ↗</a>
        </div>
      )}
    </div>
  );
}