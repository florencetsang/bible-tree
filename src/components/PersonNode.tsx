import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PersonFlowNode } from '../lib/graph';
import type { Person } from '../types';
import { formatDates } from '../lib/format';
import { lineageVars } from '../theme';
import { useTree } from '../store';

export function Avatar({ person, size }: { person: Person; size: number }) {
  const [failed, setFailed] = useState(false);
  if (person.portrait && !failed)
    return <img className="avatar" src={person.portrait} alt="" width={size} height={size} onError={() => setFailed(true)} />;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">
      {person.name[0]}
    </span>
  );
}

export const PersonNode = memo(function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const { person: p, dimmed, active } = data;
  const select = useTree((s) => s.select);
  const dates = formatDates(p);
  const cls = ['person', `tier-${p.tier}`, dimmed && 'dimmed', active && 'active'].filter(Boolean).join(' ');

  return (
    <div className={cls} style={lineageVars(p.lineage)}>
      <Handle type="target" position={Position.Top} id="t" isConnectable={false} />
      <Handle type="target" position={Position.Left} id="l" isConnectable={false} />
      <button
        type="button"
        className="node-btn"
        onClick={() => select(p.id)}
        aria-label={`${p.name}${dates ? `, ${dates}` : ''}. Show details`}
        title={p.aliases?.length ? `${p.name} (${p.aliases.join(', ')})` : p.name}
      >
        {p.tier === 1 && <Avatar person={p} size={40} />}
        <span className="node-text">
          <span className="node-name">{p.name}</span>
          {dates && <span className="node-detail">{dates}</span>}
        </span>
      </button>
      <Handle type="source" position={Position.Right} id="r" isConnectable={false} />
      <Handle type="source" position={Position.Bottom} id="b" isConnectable={false} />
    </div>
  );
});