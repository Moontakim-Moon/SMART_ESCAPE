import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { BuildingGraphData, HazardState, RouteResult } from './types/graph';
import type { Language } from './localization/i18n';
import { sampleBuildingData } from './data/sampleBuilding';
import { findBestRoute } from './algorithms/routing';
import { Header } from './components/Header';
import { ImportCard } from './components/ImportCard';
import { HazardControlPanel } from './components/HazardControlPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { RouteInspector } from './components/RouteInspector';
import { EmptyState } from './components/EmptyState';
import './App.css';

function createHazardStateFromInitial(graph: BuildingGraphData): HazardState {
  const init = graph.initial_state;
  return {
    blockedNodes: new Set(init?.blocked_nodes || []),
    blockedEdges: new Set(init?.blocked_edges || []),
    closedExits: new Set(init?.closed_exits || []),
  };
}

export const App: React.FC = () => {
  // Current active building dataset (null at initial start to comply with Rule 38)
  const [graph, setGraph] = useState<BuildingGraphData | null>(null);

  // Selected starting room or junction
  const [selectedStart, setSelectedStart] = useState<string | null>(null);

  // Active hazard state
  const [hazardState, setHazardState] = useState<HazardState>({
    blockedNodes: new Set(),
    blockedEdges: new Set(),
    closedExits: new Set(),
  });

  // Language state: 'en' | 'bn'
  const [lang, setLang] = useState<Language>('en');

  // Display toggles
  const [showCosts, setShowCosts] = useState<boolean>(true);

  // Walkthrough animation state
  const [walkthroughStepIndex, setWalkthroughStepIndex] = useState<number | null>(null);
  const [isPlayingWalkthrough, setIsPlayingWalkthrough] = useState<boolean>(false);
  const walkthroughTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load a building dataset
  const handleLoadDataset = useCallback((data: BuildingGraphData) => {
    setGraph(data);
    const newHazards = createHazardStateFromInitial(data);
    setHazardState(newHazards);

    // Pick first unblocked room or junction as default start
    const validStarts = data.nodes.filter(
      (n) => (n.type === 'room' || n.type === 'junction') && !newHazards.blockedNodes.has(n.id)
    );
    if (validStarts.length > 0) {
      setSelectedStart(validStarts[0].id);
    } else {
      setSelectedStart(null);
    }

    setWalkthroughStepIndex(null);
    setIsPlayingWalkthrough(false);
  }, []);

  // Quick action: Load official sample scenario
  const handleLoadSample = useCallback(() => {
    handleLoadDataset(sampleBuildingData);
    // Explicitly select R1 for baseline scenario
    setSelectedStart('R1');
  }, [handleLoadDataset]);

  // Reset behavior (Requirement 13)
  // Restores exact original initial_state from imported JSON
  const handleReset = useCallback(() => {
    if (!graph) return;
    const initialHazards = createHazardStateFromInitial(graph);
    setHazardState(initialHazards);
    setWalkthroughStepIndex(null);
    setIsPlayingWalkthrough(false);
  }, [graph]);

  // Select start location
  const handleSelectStart = useCallback((nodeId: string) => {
    setSelectedStart(nodeId);
    setWalkthroughStepIndex(null);
    setIsPlayingWalkthrough(false);
  }, []);

  // Toggle blocked status of a room/junction node
  const handleToggleNodeBlocked = useCallback((nodeId: string) => {
    setHazardState((prev) => {
      const nextBlocked = new Set(prev.blockedNodes);
      if (nextBlocked.has(nodeId)) {
        nextBlocked.delete(nodeId);
      } else {
        nextBlocked.add(nodeId);
      }
      return {
        ...prev,
        blockedNodes: nextBlocked,
      };
    });
    setWalkthroughStepIndex(null);
    setIsPlayingWalkthrough(false);
  }, []);

  // Toggle blocked status of a corridor edge
  const handleToggleEdgeBlocked = useCallback((edgeId: string) => {
    setHazardState((prev) => {
      const nextEdges = new Set(prev.blockedEdges);
      if (nextEdges.has(edgeId)) {
        nextEdges.delete(edgeId);
      } else {
        nextEdges.add(edgeId);
      }
      return {
        ...prev,
        blockedEdges: nextEdges,
      };
    });
    setWalkthroughStepIndex(null);
    setIsPlayingWalkthrough(false);
  }, []);

  // Toggle closed status of an exit
  const handleToggleExitClosed = useCallback((exitId: string) => {
    setHazardState((prev) => {
      const nextExits = new Set(prev.closedExits);
      if (nextExits.has(exitId)) {
        nextExits.delete(exitId);
      } else {
        nextExits.add(exitId);
      }
      return {
        ...prev,
        closedExits: nextExits,
      };
    });
    setWalkthroughStepIndex(null);
    setIsPlayingWalkthrough(false);
  }, []);

  // Compute best route immediately whenever graph, start location, or hazard state changes
  const routeResult: RouteResult = useMemo(() => {
    if (!graph || !selectedStart) {
      return { status: 'no-route' };
    }
    return findBestRoute(graph, selectedStart, hazardState);
  }, [graph, selectedStart, hazardState]);

  // Walkthrough animation loop
  useEffect(() => {
    if (isPlayingWalkthrough && routeResult.status === 'ok' && routeResult.path) {
      walkthroughTimerRef.current = setInterval(() => {
        setWalkthroughStepIndex((prev) => {
          if (prev === null) return 0;
          if (prev >= routeResult.path!.length - 1) {
            setIsPlayingWalkthrough(false);
            return routeResult.path!.length - 1;
          }
          return prev + 1;
        });
      }, 750);
    } else {
      if (walkthroughTimerRef.current) {
        clearInterval(walkthroughTimerRef.current);
        walkthroughTimerRef.current = null;
      }
    }

    return () => {
      if (walkthroughTimerRef.current) {
        clearInterval(walkthroughTimerRef.current);
      }
    };
  }, [isPlayingWalkthrough, routeResult]);

  const handleToggleWalkthrough = () => {
    if (routeResult.status !== 'ok' || !routeResult.path) return;
    if (isPlayingWalkthrough) {
      setIsPlayingWalkthrough(false);
    } else {
      if (walkthroughStepIndex === null || walkthroughStepIndex >= routeResult.path.length - 1) {
        setWalkthroughStepIndex(0);
      }
      setIsPlayingWalkthrough(true);
    }
  };

  const handleResetWalkthrough = () => {
    setIsPlayingWalkthrough(false);
    setWalkthroughStepIndex(null);
  };

  // Export SVG Floor Plan
  const handleExportSvg = () => {
    const svgEl = document.querySelector('.graph-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${graph?.building || 'smart-escape'}-evacuation-map.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="smart-escape-app">
      <Header
        buildingName={graph?.building || ''}
        lang={lang}
        onLanguageChange={setLang}
        onReset={handleReset}
        onLoadSample={handleLoadSample}
        onExportSvg={handleExportSvg}
      />

      <main className="app-main-layout">
        {!graph ? (
          <EmptyState
            onLoadDemo={handleLoadSample}
            onBrowseFileClick={() => {
              const fileInput = document.getElementById('building-file-input') as HTMLInputElement | null;
              fileInput?.click();
            }}
            lang={lang}
          />
        ) : (
          <div className="dashboard-grid">
            {/* Left Panel: Import & Operations */}
            <aside className="panel panel-left">
              <ImportCard
                onImportSuccess={handleLoadDataset}
                lang={lang}
                hasLoadedDataset={Boolean(graph)}
              />
              <HazardControlPanel
                graph={graph}
                hazardState={hazardState}
                selectedStart={selectedStart}
                onSelectStart={handleSelectStart}
                onToggleNodeBlocked={handleToggleNodeBlocked}
                onToggleEdgeBlocked={handleToggleEdgeBlocked}
                onToggleExitClosed={handleToggleExitClosed}
                lang={lang}
              />
            </aside>

            {/* Center Panel: Interactive Graph Map */}
            <section className="panel panel-center">
              <GraphCanvas
                graph={graph}
                selectedStart={selectedStart}
                routeResult={routeResult}
                hazardState={hazardState}
                onSelectStart={handleSelectStart}
                onToggleNodeBlocked={handleToggleNodeBlocked}
                onToggleEdgeBlocked={handleToggleEdgeBlocked}
                onToggleExitClosed={handleToggleExitClosed}
                showCosts={showCosts}
                onToggleShowCosts={() => setShowCosts((prev) => !prev)}
                walkthroughStepIndex={walkthroughStepIndex}
                lang={lang}
              />
            </section>

            {/* Right Panel: Route Analysis & Inspector */}
            <aside className="panel panel-right">
              <RouteInspector
                graph={graph}
                routeResult={routeResult}
                selectedStart={selectedStart}
                hazardState={hazardState}
                walkthroughStepIndex={walkthroughStepIndex}
                isPlayingWalkthrough={isPlayingWalkthrough}
                onToggleWalkthrough={handleToggleWalkthrough}
                onResetWalkthrough={handleResetWalkthrough}
                lang={lang}
              />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
