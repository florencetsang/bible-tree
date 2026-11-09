import { useCallback, useEffect, useMemo } from 'react';
import {
  Background, Controls, MiniMap, Panel, ReactFlow,
  useNodesInitialized, useNodesState, useReactFlow, useStore,
} from '@xyflow/react';
import { buildEdges, buildNodes, highlightSet, type TreeNode } from '../lib/graph';
import { LINEAGE } from '../theme';
import { useTree } from '../store';
import { PersonNode } from './PersonNode';
import { BandNode, LabelNode, RegionNode } from './AnnotationNodes';
import { TimelineRail } from './TimelineRail';

const nodeTypes = { person: PersonNode, band: BandNode, region: RegionNode, label: LabelNode };
const initialNodes = buildNodes();
const baseEdges = buildEdges();

const EDIT_MODE = new URLSearchParams(window.location.search).has('edit');
const DEEP_LINKED = !!useTree.getState().selectedId;
// Initial view: the top of the poster. Use plain `fitView` (no nodes option) for a full overview.
const START_VIEW = ['adam', 'eve', 'noah', 'abraham', 'sarah'].map((id) => ({ id }));

export function FamilyCanvas() {
  const selectedId = useTree((s) => s.selectedId);
  const highlight = useTree((s) => s.highlight);
  const focus = useTree((s) => s.focus);
  const select = useTree((s) => s.select);

  const [nodes, setNodes, onNodesChange] = useNodesState<TreeNode>(initialNodes);
  const { setCenter, getNode, getZoom, getNodes } = useReactFlow<TreeNode>();
  const nodesReady = useNodesInitialized();

  // Zoom-dependent detail: CSS hides minor names when zoomed far out.
  const zoomClass = useStore((s) => {
    const z = s.transform[2];
    return z < 0.45 ? 'zoom-far' : z < 0.9 ? 'zoom-mid' : 'zoom-near';
  });

  // Ancestor/descendant highlighting
  const lit = useMemo(() => highlightSet(selectedId, highlight), [selectedId, highlight]);

  useEffect(() => {
    setNodes((ns) =>
      ns.map((n): TreeNode =>
        n.type !== 'person'
          ? n
          : { ...n, data: { ...n.data, active: n.id === selectedId, dimmed: lit ? !lit.has(n.id) : false } },
      ),
    );
  }, [lit, selectedId, setNodes]);

  const edges = useMemo(
    () =>
      !lit
        ? baseEdges
        : baseEdges.map((e) => ({
            ...e,
            className: `${e.className} ${lit.has(e.source) && lit.has(e.target) ? 'lit' : 'dimmed'}`,
          })),
    [lit],
  );

  // Fly to a person (search, family link in drawer, deep link). Offset so the drawer doesn't cover them.
  useEffect(() => {
    if (!nodesReady || !focus) return;
    const n = getNode(focus.id);
    if (!n) return;
    const zoom = Math.max(getZoom(), 0.9);
    const mobile = window.innerWidth <= 700;
    requestAnimationFrame(() =>
      setCenter(
        n.position.x + (mobile ? 0 : 200 / zoom),
        n.position.y + (mobile ? (window.innerHeight * 0.25) / zoom : 0),
        { zoom, duration: 600 },
      ),
    );
  }, [focus, nodesReady, getNode, getZoom, setCenter]);

  // Layout editor: open with ?edit, drag nodes, then paste into layout.json
  const copyLayout = useCallback(() => {
    const rows = getNodes()
      .filter((n) => n.type === 'person')
      .map((n) => `  "${n.id}": [${Math.round(n.position.x)}, ${Math.round(n.position.y)}]`);
    void navigator.clipboard.writeText(`{\n${rows.join(',\n')}\n}\n`);
  }, [getNodes]);

  return (
    <div className={`canvas ${zoomClass}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        nodeOrigin={[0.5, 0.5]} // layout x/y = node centre
        nodesDraggable={EDIT_MODE}
        nodesConnectable={false}
        elementsSelectable={false}
        snapToGrid={EDIT_MODE}
        snapGrid={[10, 10]}
        onPaneClick={() => select(null)}
        fitView={!DEEP_LINKED}
        fitViewOptions={{ nodes: START_VIEW, padding: 0.25 }}
        minZoom={0.08}
        maxZoom={2.5}
      >
        <Background color="#e3d3b0" gap={48} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap<TreeNode>
          pannable
          zoomable
          position="bottom-right"
          maskColor="rgb(247 238 219 / 0.7)"
          nodeColor={(n) =>
            n.type === 'person' ? LINEAGE[n.data.person.lineage].color : n.type === 'band' ? '#3b2a24' : 'transparent'
          }
        />
        {EDIT_MODE && (
          <Panel position="top-center" className="edit-panel">
            Edit mode: drag people, then <button onClick={copyLayout}>Copy layout.json</button>
          </Panel>
        )}
      </ReactFlow>
      <TimelineRail side="biblical" />
      <TimelineRail side="secular" />
    </div>
  );
}