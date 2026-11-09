import type { NodeProps } from '@xyflow/react';
import type { BandFlowNode, LabelFlowNode, RegionFlowNode } from '../lib/graph';
import { LINEAGE } from '../theme';

export function BandNode({ data }: NodeProps<BandFlowNode>) {
  return <div className="band" style={{ width: data.w }}>{data.label}</div>;
}

export function RegionNode({ data }: NodeProps<RegionFlowNode>) {
  return (
    <div className="region" style={{ width: data.w, height: data.h }}>
      <span>{data.label}</span>
    </div>
  );
}

export function LabelNode({ data }: NodeProps<LabelFlowNode>) {
  return (
    <div className="region-label" style={{ color: data.lineage ? LINEAGE[data.lineage].ink : undefined }}>
      {data.label}
    </div>
  );
}