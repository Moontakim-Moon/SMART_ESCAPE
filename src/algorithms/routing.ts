import type { BuildingGraphData, HazardState, RouteResult } from '../types/graph';

/**
 * Compares two path node sequences lexicographically element-by-element.
 * Returns negative if pathA < pathB, positive if pathA > pathB, 0 if identical.
 */
export function comparePathSequences(pathA: string[], pathB: string[]): number {
  const minLen = Math.min(pathA.length, pathB.length);
  for (let i = 0; i < minLen; i++) {
    if (pathA[i] < pathB[i]) return -1;
    if (pathA[i] > pathB[i]) return 1;
  }
  return pathA.length - pathB.length;
}

interface NeighborEdge {
  neighborId: string;
  cost: number;
}

/**
 * Computes the optimal evacuation route from startNodeId to an accessible open exit.
 * Adheres strictly to the Smart Escape routing and tie-breaking specifications:
 * - Only uses positive edge costs.
 * - Start must be an unblocked room or junction.
 * - Blocked nodes and closed exits are excluded.
 * - Any corridor incident to a blocked node or closed exit is unusable.
 * - Blocked corridors are excluded.
 * - Evaluates all reachable open exits for minimum total path cost.
 * - Tie-break 1: Lexicographically smallest exit ID.
 * - Tie-break 2: Lexicographically smallest sequence of node IDs.
 */
export function findBestRoute(
  graph: BuildingGraphData,
  startNodeId: string,
  state: HazardState
): RouteResult {
  const { nodes, edges } = graph;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);

  if (!startNode) {
    return { status: 'no-route' };
  }

  // Start must be room or junction (exits are not valid start locations)
  if (startNode.type === 'exit') {
    return { status: 'no-route' };
  }

  // Rule: If the selected start is currently blocked
  if (state.blockedNodes.has(startNodeId)) {
    return {
      status: 'start-blocked',
      start: startNodeId,
    };
  }

  // Identify usable open exits
  const openExitIds = new Set<string>();
  for (const n of nodes) {
    if (n.type === 'exit' && !state.closedExits.has(n.id) && !state.blockedNodes.has(n.id)) {
      openExitIds.add(n.id);
    }
  }

  // If no exits are open in the entire building
  if (openExitIds.size === 0) {
    return {
      status: 'no-route',
      start: startNodeId,
    };
  }

  // Build usable adjacency list
  // Nodes cannot be used if blocked or if closed exit
  const isNodeUsable = (id: string): boolean => {
    if (state.blockedNodes.has(id)) return false;
    if (state.closedExits.has(id)) return false;
    return true;
  };

  const adj = new Map<string, NeighborEdge[]>();
  for (const n of nodes) {
    if (isNodeUsable(n.id)) {
      adj.set(n.id, []);
    }
  }

  for (const e of edges) {
    // Blocked edge cannot be used
    if (state.blockedEdges.has(e.id)) continue;

    // Both endpoints must be usable
    if (!isNodeUsable(e.from) || !isNodeUsable(e.to)) continue;

    // Undirected graph
    adj.get(e.from)?.push({ neighborId: e.to, cost: e.cost });
    adj.get(e.to)?.push({ neighborId: e.from, cost: e.cost });
  }

  // Dijkstra's Algorithm tracking all shortest predecessor links for exact tie-breaking
  const dist = new Map<string, number>();
  const predecessors = new Map<string, Set<string>>();
  const visited = new Set<string>();

  dist.set(startNodeId, 0);

  while (true) {
    let u: string | null = null;
    let minDist = Infinity;

    for (const [nodeId, d] of dist.entries()) {
      if (!visited.has(nodeId) && d < minDist) {
        minDist = d;
        u = nodeId;
      }
    }

    if (u === null || minDist === Infinity) {
      break;
    }

    visited.add(u);

    // If u is an open exit, we do not need to route THROUGH it to other places,
    // as an open exit is a terminal destination
    if (openExitIds.has(u) && u !== startNodeId) {
      continue;
    }

    const neighbors = adj.get(u) || [];
    for (const { neighborId: v, cost } of neighbors) {
      if (visited.has(v)) continue;

      const newDist = minDist + cost;
      const currentDist = dist.get(v) ?? Infinity;

      if (newDist < currentDist) {
        dist.set(v, newDist);
        predecessors.set(v, new Set([u]));
      } else if (newDist === currentDist) {
        predecessors.get(v)?.add(u);
      }
    }
  }

  // Find all reachable open exits
  const reachableExits: Array<{ id: string; cost: number }> = [];
  for (const exitId of openExitIds) {
    const d = dist.get(exitId);
    if (d !== undefined && Number.isFinite(d)) {
      reachableExits.push({ id: exitId, cost: d });
    }
  }

  if (reachableExits.length === 0) {
    return {
      status: 'no-route',
      start: startNodeId,
    };
  }

  // Find the minimum cost among reachable open exits
  let minCost = Infinity;
  for (const r of reachableExits) {
    if (r.cost < minCost) {
      minCost = r.cost;
    }
  }

  // Filter exits that share this exact minimum cost
  const minCostExits = reachableExits.filter((r) => r.cost === minCost);

  // Tie-break rule 1: Lexicographically smallest exit ID
  minCostExits.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const chosenExit = minCostExits[0];

  // Tie-break rule 2: Find lexicographically smallest node sequence to chosenExit
  // Using memoized shortest-path DAG traversal backwards from chosenExit to startNodeId
  const memoPaths = new Map<string, string[]>();

  function getBestPathFrom(nodeId: string): string[] {
    if (nodeId === startNodeId) {
      return [startNodeId];
    }
    if (memoPaths.has(nodeId)) {
      return memoPaths.get(nodeId)!;
    }

    const preds = Array.from(predecessors.get(nodeId) || []);
    let bestCandidatePath: string[] | null = null;

    for (const p of preds) {
      const candidate = [...getBestPathFrom(p), nodeId];
      if (!bestCandidatePath || comparePathSequences(candidate, bestCandidatePath) < 0) {
        bestCandidatePath = candidate;
      }
    }

    const finalPath = bestCandidatePath || [nodeId];
    memoPaths.set(nodeId, finalPath);
    return finalPath;
  }

  const chosenPath = getBestPathFrom(chosenExit.id);

  return {
    status: 'ok',
    start: startNodeId,
    exit: chosenExit.id,
    path: chosenPath,
    cost: chosenExit.cost,
    evaluatedExitsCount: reachableExits.length,
  };
}
