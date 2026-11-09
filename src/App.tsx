import { ReactFlowProvider } from '@xyflow/react';
import { FamilyCanvas } from './components/FamilyCanvas';
import { DetailDrawer } from './components/DetailDrawer';
import { SearchBox } from './components/SearchBox';
import { LINEAGE, lineageVars } from './theme';
import type { Lineage } from './types';

export default function App() {
  return (
      <ReactFlowProvider>
        <div className="app">
          <header className="topbar">
            <h1>Biblical Family Tree</h1>
            <SearchBox />
            <div className="legend">
              {(Object.keys(LINEAGE) as Lineage[]).map((l) => (
                  <span key={l} style={lineageVars(l)}>{LINEAGE[l].label}</span>
              ))}
            </div>
          </header>
          <main className="stage">
            <FamilyCanvas />
            <DetailDrawer />
          </main>
        </div>
      </ReactFlowProvider>
  );
}