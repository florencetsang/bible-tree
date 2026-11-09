import { useViewport } from '@xyflow/react';
import { timeline } from '../lib/graph';

export function TimelineRail({ side }: { side: 'biblical' | 'secular' }) {
  const { y, zoom } = useViewport();
  const items = timeline.filter((t) => t.side === side);

  return (
    <aside className={`rail rail-${side}`} aria-hidden="true">
      <h3>{side === 'biblical' ? 'Biblical account' : 'Secular account'}</h3>
      {items.map((t) => (
        <div key={t.id} className="rail-item" style={{ transform: `translateY(${t.y * zoom + y}px)` }}>
          <strong>{t.label}</strong>
          {t.date && <span>{t.date}</span>}
        </div>
      ))}
    </aside>
  );
}