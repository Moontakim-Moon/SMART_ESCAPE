import React, { useState, useMemo } from 'react';
import type { BuildingGraphData, HazardState } from '../types/graph';
import type { Language } from '../localization/i18n';
import { translations } from '../localization/i18n';
import { Flame, ShieldAlert, DoorClosed, Waypoints, Search, MapPin, AlertTriangle } from 'lucide-react';

interface HazardControlPanelProps {
  graph: BuildingGraphData;
  hazardState: HazardState;
  selectedStart: string | null;
  onSelectStart: (nodeId: string) => void;
  onToggleNodeBlocked: (nodeId: string) => void;
  onToggleEdgeBlocked: (edgeId: string) => void;
  onToggleExitClosed: (exitId: string) => void;
  lang: Language;
}

type HazardTab = 'nodes' | 'edges' | 'exits';

export const HazardControlPanel: React.FC<HazardControlPanelProps> = ({
  graph,
  hazardState,
  selectedStart,
  onSelectStart,
  onToggleNodeBlocked,
  onToggleEdgeBlocked,
  onToggleExitClosed,
  lang,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<HazardTab>('nodes');
  const [searchQuery, setSearchQuery] = useState('');

  // Eligible starting locations: rooms and junctions only
  const eligibleStartNodes = useMemo(() => {
    return graph.nodes.filter((n) => n.type === 'room' || n.type === 'junction');
  }, [graph.nodes]);

  // Is selected start currently blocked?
  const isStartBlocked = selectedStart ? hazardState.blockedNodes.has(selectedStart) : false;

  // Filtered nodes
  const roomsAndJunctions = useMemo(() => {
    return graph.nodes.filter(
      (n) =>
        (n.type === 'room' || n.type === 'junction') &&
        (n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [graph.nodes, searchQuery]);

  // Filtered edges
  const corridors = useMemo(() => {
    return graph.edges.filter(
      (e) =>
        e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.to.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [graph.edges, searchQuery]);

  // Filtered exits
  const exits = useMemo(() => {
    return graph.nodes.filter(
      (n) =>
        n.type === 'exit' &&
        (n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [graph.nodes, searchQuery]);

  // Active hazard counters
  const totalActiveHazards =
    hazardState.blockedNodes.size + hazardState.blockedEdges.size + hazardState.closedExits.size;

  return (
    <div className="card hazard-card">
      {/* Start Location Selection Section */}
      <div className="section-start-selector">
        <div className="card-header">
          <div className="card-title-group">
            <MapPin size={17} className="card-icon card-icon-cyan" />
            <h2 className="card-title">{t.startLocation}</h2>
          </div>
          {isStartBlocked && (
            <span className="badge-start-blocked-warning" title={t.startingLocationBlocked}>
              <AlertTriangle size={13} />
              {t.statusStartBlocked}
            </span>
          )}
        </div>

        <p className="section-subtext">{t.selectStartPrompt}</p>

        <div className="selector-wrapper">
          <select
            className={`start-select-dropdown ${isStartBlocked ? 'select-warning' : ''}`}
            value={selectedStart || ''}
            onChange={(e) => onSelectStart(e.target.value)}
            aria-label={t.chooseStartLocation}
          >
            <option value="" disabled>
              -- {t.chooseStartLocation} --
            </option>
            {eligibleStartNodes.map((n) => {
              const isBlocked = hazardState.blockedNodes.has(n.id);
              return (
                <option key={n.id} value={n.id}>
                  {n.id} - {n.label} ({n.type.toUpperCase()}) {isBlocked ? `⚠️ [BLOCKED]` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quick select chip list */}
        <div className="quick-start-chips">
          {eligibleStartNodes.map((n) => {
            const isSelected = selectedStart === n.id;
            const isBlocked = hazardState.blockedNodes.has(n.id);
            return (
              <button
                key={n.id}
                className={`start-chip ${isSelected ? 'start-chip-active' : ''} ${
                  isBlocked ? 'start-chip-blocked' : ''
                }`}
                onClick={() => onSelectStart(n.id)}
                title={`${n.label} (${isBlocked ? 'Blocked' : 'Clear'})`}
              >
                <span className="chip-type-tag">{n.type === 'room' ? 'R' : 'J'}</span>
                <span className="chip-id">{n.id}</span>
                {isBlocked && <span className="chip-warning-icon">⚠️</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-divider" />

      {/* Hazard Simulation Control Section */}
      <div className="section-hazards">
        <div className="card-header">
          <div className="card-title-group">
            <Flame size={17} className="card-icon card-icon-orange" />
            <h2 className="card-title">{t.hazardManagement}</h2>
          </div>
          <span className="badge-hazard-count">
            {totalActiveHazards} {t.activeHazards}
          </span>
        </div>

        {/* Search Filter Input */}
        <div className="search-filter-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t.searchFilter}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t.searchFilter}
          />
        </div>

        {/* Tabs */}
        <div className="hazard-tabs" role="tablist">
          <button
            className={`tab-btn ${activeTab === 'nodes' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('nodes')}
            role="tab"
            aria-selected={activeTab === 'nodes'}
          >
            <ShieldAlert size={14} />
            <span>{t.roomJunctions}</span>
            <span className="tab-count">({hazardState.blockedNodes.size})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'edges' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('edges')}
            role="tab"
            aria-selected={activeTab === 'edges'}
          >
            <Waypoints size={14} />
            <span>{t.corridors}</span>
            <span className="tab-count">({hazardState.blockedEdges.size})</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'exits' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveTab('exits')}
            role="tab"
            aria-selected={activeTab === 'exits'}
          >
            <DoorClosed size={14} />
            <span>{t.exits}</span>
            <span className="tab-count">({hazardState.closedExits.size})</span>
          </button>
        </div>

        {/* Tab Content List */}
        <div className="hazard-list-container">
          {activeTab === 'nodes' && (
            <div className="hazard-items-list">
              {roomsAndJunctions.map((node) => {
                const isBlocked = hazardState.blockedNodes.has(node.id);
                return (
                  <div
                    key={node.id}
                    className={`hazard-row ${isBlocked ? 'hazard-row-blocked' : ''}`}
                  >
                    <div className="hazard-row-info">
                      <span className="node-type-badge">{node.type}</span>
                      <strong className="hazard-row-id">{node.id}</strong>
                      <span className="hazard-row-label">{node.label}</span>
                    </div>
                    <button
                      className={`hazard-toggle-btn ${
                        isBlocked ? 'btn-unblock' : 'btn-block'
                      }`}
                      onClick={() => onToggleNodeBlocked(node.id)}
                    >
                      {isBlocked ? t.unblockNode : t.blockNode}
                    </button>
                  </div>
                );
              })}
              {roomsAndJunctions.length === 0 && (
                <div className="hazard-empty-msg">No matching locations found.</div>
              )}
            </div>
          )}

          {activeTab === 'edges' && (
            <div className="hazard-items-list">
              {corridors.map((edge) => {
                const isBlocked = hazardState.blockedEdges.has(edge.id);
                const isIncidentBlocked =
                  hazardState.blockedNodes.has(edge.from) ||
                  hazardState.blockedNodes.has(edge.to) ||
                  hazardState.closedExits.has(edge.from) ||
                  hazardState.closedExits.has(edge.to);

                return (
                  <div
                    key={edge.id}
                    className={`hazard-row ${isBlocked ? 'hazard-row-blocked' : ''}`}
                  >
                    <div className="hazard-row-info">
                      <strong className="hazard-row-id">{edge.id}</strong>
                      <span className="hazard-corridor-span">
                        {edge.from} ↔ {edge.to}
                      </span>
                      <span className="corridor-cost-pill">Cost: {edge.cost}</span>
                      {isIncidentBlocked && !isBlocked && (
                        <span className="incident-blocked-tag">Incident Blocked</span>
                      )}
                    </div>
                    <button
                      className={`hazard-toggle-btn ${
                        isBlocked ? 'btn-unblock' : 'btn-block'
                      }`}
                      onClick={() => onToggleEdgeBlocked(edge.id)}
                    >
                      {isBlocked ? t.unblockCorridor : t.blockCorridor}
                    </button>
                  </div>
                );
              })}
              {corridors.length === 0 && (
                <div className="hazard-empty-msg">No matching corridors found.</div>
              )}
            </div>
          )}

          {activeTab === 'exits' && (
            <div className="hazard-items-list">
              {exits.map((exit) => {
                const isClosed = hazardState.closedExits.has(exit.id);
                return (
                  <div
                    key={exit.id}
                    className={`hazard-row ${isClosed ? 'hazard-row-blocked' : ''}`}
                  >
                    <div className="hazard-row-info">
                      <strong className="hazard-row-id">{exit.id}</strong>
                      <span className="hazard-row-label">{exit.label}</span>
                    </div>
                    <button
                      className={`hazard-toggle-btn ${
                        isClosed ? 'btn-unblock' : 'btn-close-exit'
                      }`}
                      onClick={() => onToggleExitClosed(exit.id)}
                    >
                      {isClosed ? t.reopenExit : t.closeExit}
                    </button>
                  </div>
                );
              })}
              {exits.length === 0 && (
                <div className="hazard-empty-msg">No emergency exits found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
