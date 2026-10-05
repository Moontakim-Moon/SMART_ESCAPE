import React, { useRef, useState, useMemo, useEffect } from 'react';
import type { BuildingGraphData, HazardState, RouteResult } from '../types/graph';
import type { Language } from '../localization/i18n';
import { translations } from '../localization/i18n';
import { ZoomIn, ZoomOut, Maximize2, Tag } from 'lucide-react';

interface GraphCanvasProps {
  graph: BuildingGraphData;
  selectedStart: string | null;
  routeResult: RouteResult;
  hazardState: HazardState;
  onSelectStart: (nodeId: string) => void;
  onToggleNodeBlocked: (nodeId: string) => void;
  onToggleEdgeBlocked: (edgeId: string) => void;
  onToggleExitClosed: (exitId: string) => void;
  showCosts: boolean;
  onToggleShowCosts?: () => void;
  walkthroughStepIndex?: number | null;
  lang: Language;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  selectedStart,
  routeResult,
  hazardState,
  onSelectStart,
  onToggleNodeBlocked,
  onToggleEdgeBlocked,
  onToggleExitClosed,
  showCosts,
  onToggleShowCosts,
  walkthroughStepIndex = null,
  lang,
}) => {
  const t = translations[lang];
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute bounding box from coordinates with generous padding
  const bounds = useMemo(() => {
    if (!graph.nodes || graph.nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const n of graph.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }

    const pad = 100;
    const width = Math.max(maxX - minX + pad * 2, 400);
    const height = Math.max(maxY - minY + pad * 2, 300);

    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width,
      height,
    };
  }, [graph]);

  // Pan and Zoom transform state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset view when graph changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [graph.building]);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 3.0));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left mouse button only
    // Ignore clicks on interactive SVG elements
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node') || target.closest('.interactive-edge')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoom(factor);
  };

  // Node lookup map
  const nodeMap = useMemo(() => {
    return new Map(graph.nodes.map((n) => [n.id, n]));
  }, [graph.nodes]);

  // Active route segments lookup
  const activeRouteSegments = useMemo(() => {
    const segments = new Set<string>();
    if (routeResult.status === 'ok' && routeResult.path && routeResult.path.length > 1) {
      for (let i = 0; i < routeResult.path.length - 1; i++) {
        const u = routeResult.path[i];
        const v = routeResult.path[i + 1];
        const key1 = `${u}__${v}`;
        const key2 = `${v}__${u}`;
        segments.add(key1);
        segments.add(key2);
      }
    }
    return segments;
  }, [routeResult]);

  const activeRouteNodes = useMemo(() => {
    return new Set(routeResult.path || []);
  }, [routeResult.path]);

  // Click handler on node:
  // If user clicks a room/junction:
  // If Shift is pressed or if it's already start, toggle blocked.
  // Otherwise, select it as start location.
  // If exit is clicked, toggle closed/open exit.
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodeMap.get(nodeId);
    if (!node) return;

    if (node.type === 'exit') {
      onToggleExitClosed(nodeId);
      return;
    }

    if (e.shiftKey || e.altKey) {
      onToggleNodeBlocked(nodeId);
    } else {
      if (hazardState.blockedNodes.has(nodeId)) {
        // If it's blocked, clicking it can unblock or notify
        onToggleNodeBlocked(nodeId);
      } else {
        onSelectStart(nodeId);
      }
    }
  };

  return (
    <div
      className="graph-canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      role="region"
      aria-label="Building Evacuation Graph Map"
      tabIndex={0}
    >
      {/* Floating Canvas Controls */}
      <div className="canvas-toolbar">
        <button
          className="toolbar-btn"
          onClick={() => handleZoom(0.15)}
          title={t.zoomIn}
          aria-label={t.zoomIn}
        >
          <ZoomIn size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={() => handleZoom(-0.15)}
          title={t.zoomOut}
          aria-label={t.zoomOut}
        >
          <ZoomOut size={16} />
        </button>
        <button
          className="toolbar-btn"
          onClick={handleResetView}
          title={t.resetView}
          aria-label={t.resetView}
        >
          <Maximize2 size={16} />
        </button>
        {onToggleShowCosts && (
          <button
            className={`toolbar-btn ${showCosts ? 'toolbar-btn-active' : ''}`}
            onClick={onToggleShowCosts}
            title={t.toggleCosts}
            aria-label={t.toggleCosts}
          >
            <Tag size={15} />
          </button>
        )}
        <div className="zoom-indicator">{Math.round(zoom * 100)}%</div>
      </div>

      {/* SVG Viewport */}
      <svg
        ref={svgRef}
        className="graph-svg"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
          </pattern>

          {/* Hazard diagonal stripes pattern */}
          <pattern id="hazardStripe" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#ef4444" strokeWidth="4" />
            <line x1="6" y1="0" x2="6" y2="12" stroke="#1f2937" strokeWidth="6" />
          </pattern>

          {/* Glow Filters */}
          <filter id="routeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="hazardGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="startGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Route Arrow Marker */}
          <marker
            id="routeArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
          </marker>
        </defs>

        {/* Transform Group for Zoom & Pan */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background Grid */}
          <rect
            x={bounds.minX - 500}
            y={bounds.minY - 500}
            width={bounds.width + 1000}
            height={bounds.height + 1000}
            fill="url(#archGrid)"
            className="grid-bg"
          />

          {/* ================= EDGES (CORRIDORS) ================= */}
          <g className="edges-layer">
            {graph.edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isBlocked = hazardState.blockedEdges.has(edge.id);
              const isIncidentToBlockedNode =
                hazardState.blockedNodes.has(edge.from) ||
                hazardState.blockedNodes.has(edge.to) ||
                hazardState.closedExits.has(edge.from) ||
                hazardState.closedExits.has(edge.to);

              const isActiveRoute =
                routeResult.status === 'ok' &&
                !isBlocked &&
                !isIncidentToBlockedNode &&
                (activeRouteSegments.has(`${edge.from}__${edge.to}`) ||
                  activeRouteSegments.has(`${edge.to}__${edge.from}`));

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g
                  key={edge.id}
                  className={`edge-group interactive-edge ${isBlocked ? 'edge-blocked' : ''} ${
                    isActiveRoute ? 'edge-active' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleEdgeBlocked(edge.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Corridor ${edge.id} from ${edge.from} to ${edge.to}, cost ${edge.cost}, ${
                    isBlocked ? 'Blocked' : 'Clear'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleEdgeBlocked(edge.id);
                    }
                  }}
                >
                  {/* Invisible wide hit area for easy clicking */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="transparent"
                    strokeWidth="24"
                    cursor="pointer"
                  />

                  {/* Base Corridor Line */}
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    className="edge-base"
                    stroke={
                      isBlocked || isIncidentToBlockedNode
                        ? '#ef4444'
                        : isActiveRoute
                        ? '#10b981'
                        : '#334155'
                    }
                    strokeWidth={isActiveRoute ? 5 : isBlocked ? 3 : 2.5}
                    strokeDasharray={isBlocked || isIncidentToBlockedNode ? '6 4' : 'none'}
                    strokeOpacity={isIncidentToBlockedNode && !isBlocked ? 0.35 : 1}
                  />

                  {/* Active Route Glow & Animated Pulse */}
                  {isActiveRoute && (
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      className="edge-route-pulse"
                      stroke="#06b6d4"
                      strokeWidth="3.5"
                      strokeDasharray="8 6"
                      filter="url(#routeGlow)"
                    />
                  )}

                  {/* Corridor Cost Badge */}
                  {showCosts && (
                    <g transform={`translate(${midX}, ${midY})`} className="cost-badge-group">
                      <rect
                        x="-14"
                        y="-10"
                        width="28"
                        height="20"
                        rx="5"
                        className={`cost-badge-bg ${
                          isBlocked
                            ? 'cost-badge-blocked'
                            : isActiveRoute
                            ? 'cost-badge-active'
                            : 'cost-badge-normal'
                        }`}
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        className="cost-badge-text"
                      >
                        {edge.cost}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* ================= NODES ================= */}
          <g className="nodes-layer">
            {graph.nodes.map((node) => {
              const isSelectedStart = selectedStart === node.id;
              const isBlockedNode = hazardState.blockedNodes.has(node.id);
              const isClosedExit = hazardState.closedExits.has(node.id);
              const isTargetExit = routeResult.status === 'ok' && routeResult.exit === node.id;
              const isOnActiveRoute = activeRouteNodes.has(node.id);
              const isWalkthroughNode =
                walkthroughStepIndex !== null &&
                routeResult.path &&
                routeResult.path[walkthroughStepIndex] === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`node-group interactive-node node-${node.type} ${
                    isSelectedStart ? 'node-selected-start' : ''
                  } ${isBlockedNode ? 'node-blocked' : ''} ${isClosedExit ? 'node-closed-exit' : ''} ${
                    isTargetExit ? 'node-target-exit' : ''
                  } ${isOnActiveRoute ? 'node-on-route' : ''}`}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.type.toUpperCase()}: ${node.label} (${node.id}), Status: ${
                    isBlockedNode
                      ? 'Blocked'
                      : isClosedExit
                      ? 'Closed'
                      : isSelectedStart
                      ? 'Selected Starting Location'
                      : isOnActiveRoute
                      ? 'On Evacuation Route'
                      : 'Available'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNodeClick(e as unknown as React.MouseEvent, node.id);
                    }
                  }}
                >
                  {/* Selection Pulsing Aura for Start Node */}
                  {isSelectedStart && (
                    <circle
                      r="34"
                      className="start-pulse-aura"
                      fill="none"
                      stroke={isBlockedNode ? '#ef4444' : '#38bdf8'}
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                      filter="url(#startGlow)"
                    />
                  )}

                  {/* Walkthrough Live Position Marker */}
                  {isWalkthroughNode && (
                    <circle
                      r="38"
                      className="walkthrough-live-aura"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                    />
                  )}

                  {/* SHAPE RENDERING ACCORDING TO NODE TYPE */}
                  {node.type === 'room' && (
                    // Room: Clean rounded blueprint chamber with door indicator
                    <g className="room-geometry">
                      <rect
                        x="-24"
                        y="-20"
                        width="48"
                        height="40"
                        rx="8"
                        className="node-rect-base"
                        fill={
                          isBlockedNode
                            ? 'url(#hazardStripe)'
                            : isSelectedStart
                            ? '#0369a1'
                            : isOnActiveRoute
                            ? '#065f46'
                            : '#1e293b'
                        }
                        stroke={
                          isBlockedNode
                            ? '#ef4444'
                            : isSelectedStart
                            ? '#38bdf8'
                            : isOnActiveRoute
                            ? '#10b981'
                            : '#475569'
                        }
                        strokeWidth={isSelectedStart || isOnActiveRoute || isBlockedNode ? 3 : 2}
                      />
                      {/* Door aperture icon */}
                      <path
                        d="M -6 18 L 6 18"
                        stroke="#0ea5e9"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </g>
                  )}

                  {node.type === 'junction' && (
                    // Junction: Intersection node with crosshair
                    <g className="junction-geometry">
                      <circle
                        r="18"
                        className="node-circle-base"
                        fill={
                          isBlockedNode
                            ? 'url(#hazardStripe)'
                            : isSelectedStart
                            ? '#0369a1'
                            : isOnActiveRoute
                            ? '#065f46'
                            : '#0f172a'
                        }
                        stroke={
                          isBlockedNode
                            ? '#ef4444'
                            : isSelectedStart
                            ? '#38bdf8'
                            : isOnActiveRoute
                            ? '#10b981'
                            : '#64748b'
                        }
                        strokeWidth={isSelectedStart || isOnActiveRoute || isBlockedNode ? 3 : 2}
                      />
                      {/* Inner dot */}
                      <circle
                        r="4"
                        fill={
                          isBlockedNode
                            ? '#ef4444'
                            : isSelectedStart
                            ? '#bae6fd'
                            : isOnActiveRoute
                            ? '#6ee7b7'
                            : '#94a3b8'
                        }
                      />
                    </g>
                  )}

                  {node.type === 'exit' && (
                    // Exit: High-visibility emergency egress badge
                    <g className="exit-geometry">
                      <rect
                        x="-26"
                        y="-22"
                        width="52"
                        height="44"
                        rx="8"
                        className="node-exit-base"
                        fill={
                          isClosedExit
                            ? '#371515'
                            : isTargetExit
                            ? '#064e3b'
                            : '#065f46'
                        }
                        stroke={
                          isClosedExit
                            ? '#ef4444'
                            : isTargetExit
                            ? '#34d399'
                            : '#10b981'
                        }
                        strokeWidth={isTargetExit ? 3.5 : 2.5}
                        filter={isTargetExit ? 'url(#routeGlow)' : undefined}
                      />
                      {/* Running egress symbol / icon representation */}
                      {isClosedExit ? (
                        <path
                          d="M -10 -10 L 10 10 M 10 -10 L -10 10"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      ) : (
                        <path
                          d="M -8 -8 L -2 -8 L -2 8 L -8 8 M 2 -4 L 8 0 L 2 4"
                          stroke="#a7f3d0"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      )}
                    </g>
                  )}

                  {/* Hazard Warning Icon Overlay */}
                  {isBlockedNode && (
                    <g transform="translate(14, -18)" className="hazard-warning-badge">
                      <circle r="9" fill="#ef4444" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                        !
                      </text>
                    </g>
                  )}

                  {/* Closed Exit Lock Badge */}
                  {isClosedExit && (
                    <g transform="translate(18, -18)" className="closed-exit-badge">
                      <circle r="9" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                        ✕
                      </text>
                    </g>
                  )}

                  {/* Selected Start Badge */}
                  {isSelectedStart && (
                    <g transform="translate(0, -28)" className="start-badge-pill">
                      <rect x="-24" y="-8" width="48" height="16" rx="4" fill="#0284c7" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
                        START
                      </text>
                    </g>
                  )}

                  {/* Target Destination Exit Badge */}
                  {isTargetExit && (
                    <g transform="translate(0, -30)" className="target-exit-pill">
                      <rect x="-28" y="-9" width="56" height="17" rx="4" fill="#059669" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
                        EXIT GOAL
                      </text>
                    </g>
                  )}

                  {/* Node ID Header */}
                  <text
                    x="0"
                    y={node.type === 'exit' ? 3 : 4}
                    textAnchor="middle"
                    className="node-id-text"
                  >
                    {node.id}
                  </text>

                  {/* Node Description Label Below */}
                  <text
                    x="0"
                    y="32"
                    textAnchor="middle"
                    className="node-label-text"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Canvas Legend */}
      <div className="canvas-legend">
        <div className="legend-title">{t.legend}</div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-swatch room-swatch"></span>
            <span>{t.legendRoom}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch junction-swatch"></span>
            <span>{t.legendJunction}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch exit-swatch"></span>
            <span>{t.legendExit}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch route-swatch"></span>
            <span>{t.legendActiveRoute}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch blocked-swatch"></span>
            <span>{t.legendBlocked}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch closed-swatch"></span>
            <span>{t.legendClosed}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
