import React from 'react';
import type { RouteResult, BuildingGraphData, HazardState } from '../types/graph';
import type { Language } from '../localization/i18n';
import { translations } from '../localization/i18n';
import {
  Navigation,
  ShieldCheck,
  AlertOctagon,
  Ban,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  DoorOpen,
  Zap,
} from 'lucide-react';

interface RouteInspectorProps {
  graph: BuildingGraphData;
  routeResult: RouteResult;
  selectedStart: string | null;
  hazardState: HazardState;
  walkthroughStepIndex: number | null;
  isPlayingWalkthrough: boolean;
  onToggleWalkthrough: () => void;
  onResetWalkthrough: () => void;
  lang: Language;
}

export const RouteInspector: React.FC<RouteInspectorProps> = ({
  graph,
  routeResult,
  selectedStart,
  hazardState,
  walkthroughStepIndex,
  isPlayingWalkthrough,
  onToggleWalkthrough,
  onResetWalkthrough,
  lang,
}) => {
  const t = translations[lang];

  // Node lookup
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const startNode = selectedStart ? nodeMap.get(selectedStart) : null;
  const exitNode = routeResult.exit ? nodeMap.get(routeResult.exit) : null;

  return (
    <div className="card route-inspector-card">
      <div className="card-header">
        <div className="card-title-group">
          <Navigation size={18} className="card-icon card-icon-green" />
          <h2 className="card-title">{t.routeCalculation}</h2>
        </div>
      </div>

      {/* ================= PRIMARY STATUS BANNER ================= */}
      <div className="status-banner-container">
        {routeResult.status === 'ok' && (
          <div className="route-status-box status-box-success" role="status">
            <div className="status-box-header">
              <ShieldCheck size={20} className="status-icon" />
              <div>
                <span className="status-title">{t.statusRouteFound}</span>
                <p className="status-subtitle">{t.bestRouteFound}</p>
              </div>
            </div>
          </div>
        )}

        {routeResult.status === 'start-blocked' && (
          <div className="route-status-box status-box-danger" role="alert">
            <div className="status-box-header">
              <Ban size={22} className="status-icon" />
              <div>
                <span className="status-title status-title-prominent">
                  {/* Exact requirement string */}
                  Starting location blocked
                </span>
                <p className="status-subtitle">
                  {lang === 'bn'
                    ? 'নির্বাচিত শুরুর স্থানটিতে বর্তমানে বিপদ রয়েছে। অন্য কোনো নিরাপদ স্থান নির্বাচন করুন।'
                    : 'The selected starting location is currently blocked by a hazard. Please select an unblocked room or junction.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {routeResult.status === 'no-route' && (
          <div className="route-status-box status-box-warning" role="alert">
            <div className="status-box-header">
              <AlertOctagon size={22} className="status-icon" />
              <div>
                <span className="status-title status-title-prominent">
                  {/* Exact requirement string */}
                  No route available
                </span>
                <p className="status-subtitle">
                  {lang === 'bn'
                    ? 'বিপদ বা বহির্গমন বন্ধ থাকার কারণে কোনো খোলা বের হওয়ার পথ পৌঁছানো সম্ভব নয়।'
                    : 'All paths to open emergency exits are either severed or exits are closed.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= ROUTE DETAILS (WHEN ROUTE IS OK) ================= */}
      {routeResult.status === 'ok' && routeResult.path && (
        <div className="route-details-body">
          {/* Key Metrics Grid */}
          <div className="route-metrics-grid">
            <div className="metric-cell">
              <span className="metric-label">{t.totalCost}</span>
              <div className="metric-value-row">
                <Zap size={16} className="metric-icon-accent" />
                <span className="metric-value">{routeResult.cost}</span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">{t.destinationExit}</span>
              <div className="metric-value-row">
                <DoorOpen size={16} className="metric-icon-green" />
                <span className="metric-value-exit" title={exitNode?.label}>
                  {routeResult.exit}
                </span>
              </div>
            </div>

            <div className="metric-cell">
              <span className="metric-label">{t.checkpoints}</span>
              <div className="metric-value-row">
                <span className="metric-value">{routeResult.path.length}</span>
              </div>
            </div>
          </div>

          {/* Full Node Sequence Breadcrumb */}
          <div className="route-sequence-section">
            <span className="sequence-label">{t.routeSequence}:</span>
            <div className="sequence-breadcrumb">
              {routeResult.path.map((nodeId, idx) => {
                const isStart = idx === 0;
                const isExit = idx === routeResult.path!.length - 1;
                const isCurrentWalkthrough = walkthroughStepIndex === idx;

                return (
                  <React.Fragment key={`${nodeId}-${idx}`}>
                    <div
                      className={`breadcrumb-node ${isStart ? 'breadcrumb-start' : ''} ${
                        isExit ? 'breadcrumb-exit' : ''
                      } ${isCurrentWalkthrough ? 'breadcrumb-live' : ''}`}
                      title={nodeMap.get(nodeId)?.label}
                    >
                      <span className="breadcrumb-id">{nodeId}</span>
                      {isStart && <span className="breadcrumb-tag">START</span>}
                      {isExit && <span className="breadcrumb-tag">EXIT</span>}
                    </div>
                    {idx < routeResult.path!.length - 1 && (
                      <ArrowRight size={14} className="breadcrumb-arrow" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Interactive Walkthrough Simulator */}
          <div className="walkthrough-section">
            <div className="walkthrough-controls">
              <button
                className={`btn-walkthrough ${isPlayingWalkthrough ? 'btn-walkthrough-active' : ''}`}
                onClick={onToggleWalkthrough}
                title={isPlayingWalkthrough ? t.stopWalkthrough : t.simulateWalkthrough}
              >
                {isPlayingWalkthrough ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlayingWalkthrough ? t.stopWalkthrough : t.simulateWalkthrough}</span>
              </button>

              {walkthroughStepIndex !== null && (
                <button
                  className="btn-walkthrough-reset"
                  onClick={onResetWalkthrough}
                  title="Reset Walkthrough"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              {walkthroughStepIndex !== null && (
                <span className="walkthrough-indicator">
                  {t.currentStep}: <strong>{routeResult.path[walkthroughStepIndex]}</strong> (
                  {walkthroughStepIndex + 1}/{routeResult.path.length})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Summary Footer */}
      <div className="inspector-footer">
        <div className="footer-metric-row">
          <span>{t.startLocation}:</span>
          <strong>{selectedStart ? `${selectedStart} (${startNode?.label || ''})` : '—'}</strong>
        </div>
        <div className="footer-metric-row">
          <span>{t.activeHazards}:</span>
          <span className="footer-hazard-pill">
            {hazardState.blockedNodes.size + hazardState.blockedEdges.size + hazardState.closedExits.size}
          </span>
        </div>
      </div>
    </div>
  );
};
