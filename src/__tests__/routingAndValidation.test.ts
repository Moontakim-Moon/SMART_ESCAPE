import { describe, it, expect } from 'vitest';
import { findBestRoute, comparePathSequences } from '../algorithms/routing';
import { validateBuildingData, parseAndValidateBuildingJSON } from '../services/validation';
import { sampleBuildingData } from '../data/sampleBuilding';
import type { BuildingGraphData, HazardState } from '../types/graph';

function createCleanHazardState(initial?: {
  blockedNodes?: string[];
  blockedEdges?: string[];
  closedExits?: string[];
}): HazardState {
  return {
    blockedNodes: new Set(initial?.blockedNodes || []),
    blockedEdges: new Set(initial?.blockedEdges || []),
    closedExits: new Set(initial?.closedExits || []),
  };
}

describe('Smart Escape Routing Engine & Specification Tests', () => {
  // Test 1: Baseline shortest route (Scenario 1)
  it('1. Baseline shortest route: R1 reaches E1 with cost 7', () => {
    const hazards = createCleanHazardState();
    const result = findBestRoute(sampleBuildingData, 'R1', hazards);

    expect(result.status).toBe('ok');
    expect(result.start).toBe('R1');
    expect(result.exit).toBe('E1');
    expect(result.cost).toBe(7);
    expect(result.path).toEqual(['R1', 'C1', 'C2', 'E1']);
  });

  // Test 2: Blocked node rerouting (Scenario 2: Block C2)
  it('2. Blocked node rerouting: Blocking C2 forces route to E2 with cost 11', () => {
    const hazards = createCleanHazardState({ blockedNodes: ['C2'] });
    const result = findBestRoute(sampleBuildingData, 'R1', hazards);

    expect(result.status).toBe('ok');
    expect(result.start).toBe('R1');
    expect(result.exit).toBe('E2');
    expect(result.cost).toBe(11);
    expect(result.path).toEqual(['R1', 'C1', 'C3', 'C4', 'E2']);
  });

  // Test 3: Blocked edge rerouting
  it('3. Blocked edge: Blocking edge E2 (C1-C2) avoids C2-E1 corridor', () => {
    const hazards = createCleanHazardState({ blockedEdges: ['E2'] });
    const result = findBestRoute(sampleBuildingData, 'R1', hazards);

    expect(result.status).toBe('ok');
    expect(result.exit).toBe('E2');
    expect(result.cost).toBe(11);
    expect(result.path).toEqual(['R1', 'C1', 'C3', 'C4', 'E2']);
  });

  // Test 4: Closed exit rerouting
  it('4. Closed exit: Closing E1 reroutes R1 to E2', () => {
    const hazards = createCleanHazardState({ closedExits: ['E1'] });
    const result = findBestRoute(sampleBuildingData, 'R1', hazards);

    expect(result.status).toBe('ok');
    expect(result.exit).toBe('E2');
    expect(result.cost).toBe(11);
  });

  // Test 5: All exits closed (Scenario 3)
  it('5. All exits closed: reports "no-route"', () => {
    const hazards = createCleanHazardState({ closedExits: ['E1', 'E2'] });
    const result = findBestRoute(sampleBuildingData, 'R1', hazards);

    expect(result.status).toBe('no-route');
  });

  // Test 6: Blocked start (Scenario 5)
  it('6. Blocked start: reports "start-blocked" when R1 is blocked', () => {
    const hazards = createCleanHazardState({ blockedNodes: ['R1'] });
    const result = findBestRoute(sampleBuildingData, 'R1', hazards);

    expect(result.status).toBe('start-blocked');
    expect(result.start).toBe('R1');
  });

  // Test 7: Different starting location (Scenario 4)
  it('7. Different start: R2 routes to E2 with cost 7', () => {
    const hazards = createCleanHazardState();
    const result = findBestRoute(sampleBuildingData, 'R2', hazards);

    expect(result.status).toBe('ok');
    expect(result.start).toBe('R2');
    expect(result.exit).toBe('E2');
    expect(result.cost).toBe(7);
    expect(result.path).toEqual(['R2', 'C3', 'C4', 'E2']);
  });

  // Test 8: Disconnected graph handling
  it('8. Disconnected graph: isolated room returns "no-route"', () => {
    const disconnectedGraph: BuildingGraphData = {
      building: 'Isolated Wing',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 0, y: 0 },
        { id: 'R_ISOLATED', label: 'Isolated Lab', type: 'room', x: 100, y: 100 },
        { id: 'E1', label: 'Exit 1', type: 'exit', x: 200, y: 0 },
      ],
      edges: [{ id: 'E1', from: 'R1', to: 'E1', cost: 5 }],
    };
    const hazards = createCleanHazardState();
    const result = findBestRoute(disconnectedGraph, 'R_ISOLATED', hazards);

    expect(result.status).toBe('no-route');
  });

  // Test 9 & 11: Equal-cost exits & Lexicographical exit tie-break
  it('9 & 11. Equal-cost exits tie-break: prefers lexicographically smaller exit ID', () => {
    const tieBreakGraph: BuildingGraphData = {
      building: 'Tie Break Test',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 0, y: 0 },
        { id: 'EB', label: 'Exit B', type: 'exit', x: 100, y: -50 },
        { id: 'EA', label: 'Exit A', type: 'exit', x: 100, y: 50 },
      ],
      edges: [
        { id: 'E1', from: 'R1', to: 'EB', cost: 10 },
        { id: 'E2', from: 'R1', to: 'EA', cost: 10 },
      ],
    };
    const hazards = createCleanHazardState();
    const result = findBestRoute(tieBreakGraph, 'R1', hazards);

    expect(result.status).toBe('ok');
    expect(result.cost).toBe(10);
    // 'EA' < 'EB', so EA must be chosen
    expect(result.exit).toBe('EA');
    expect(result.path).toEqual(['R1', 'EA']);
  });

  // Test 10 & 12: Equal-cost paths to same exit & Lexicographical node sequence tie-break
  it('10 & 12. Equal-cost paths to same exit tie-break: chooses lexicographically smaller node sequence', () => {
    const diamondGraph: BuildingGraphData = {
      building: 'Diamond Hallway',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 0, y: 0 },
        { id: 'CB', label: 'Corridor B', type: 'junction', x: 50, y: 50 },
        { id: 'CA', label: 'Corridor A', type: 'junction', x: 50, y: -50 },
        { id: 'E1', label: 'Exit 1', type: 'exit', x: 100, y: 0 },
      ],
      edges: [
        { id: 'E1', from: 'R1', to: 'CB', cost: 5 },
        { id: 'E2', from: 'CB', to: 'E1', cost: 5 },
        { id: 'E3', from: 'R1', to: 'CA', cost: 5 },
        { id: 'E4', from: 'CA', to: 'E1', cost: 5 },
      ],
    };
    const hazards = createCleanHazardState();
    const result = findBestRoute(diamondGraph, 'R1', hazards);

    expect(result.status).toBe('ok');
    expect(result.cost).toBe(10);
    // Sequence ['R1', 'CA', 'E1'] vs ['R1', 'CB', 'E1'] -> 'CA' < 'CB'
    expect(result.path).toEqual(['R1', 'CA', 'E1']);
  });

  it('Helper test: comparePathSequences correctly compares arrays', () => {
    expect(comparePathSequences(['A', 'B', 'D'], ['A', 'C', 'D'])).toBeLessThan(0);
    expect(comparePathSequences(['A', 'C', 'D'], ['A', 'B', 'D'])).toBeGreaterThan(0);
    expect(comparePathSequences(['A', 'B'], ['A', 'B'])).toBe(0);
    expect(comparePathSequences(['A', 'B'], ['A', 'B', 'C'])).toBeLessThan(0);
  });
});

describe('Smart Escape Validation Tests', () => {
  // Test 13: Invalid JSON syntax
  it('13. Rejects invalid JSON syntax cleanly', () => {
    const res = parseAndValidateBuildingJSON('{ building: "Broken", nodes: ');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('JSON Syntax Error');
  });

  // Test 14: Duplicate node ID
  it('14. Detects duplicate node IDs', () => {
    const invalidData = {
      building: 'Duplicate Node Lab',
      nodes: [
        { id: 'N1', label: 'Node 1', type: 'room', x: 10, y: 10 },
        { id: 'N1', label: 'Node 1 Duplicate', type: 'junction', x: 20, y: 20 },
        { id: 'E1', label: 'Exit', type: 'exit', x: 30, y: 30 },
      ],
      edges: [{ id: 'E1', from: 'N1', to: 'E1', cost: 5 }],
    };
    const res = validateBuildingData(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('Duplicate node ID'))).toBe(true);
  });

  // Test 15: Duplicate edge ID
  it('15. Detects duplicate edge IDs', () => {
    const invalidData = {
      building: 'Duplicate Edge Lab',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 10, y: 10 },
        { id: 'C1', label: 'Junction 1', type: 'junction', x: 20, y: 20 },
        { id: 'E1', label: 'Exit', type: 'exit', x: 30, y: 30 },
      ],
      edges: [
        { id: 'E_DUP', from: 'R1', to: 'C1', cost: 5 },
        { id: 'E_DUP', from: 'C1', to: 'E1', cost: 3 },
      ],
    };
    const res = validateBuildingData(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('Duplicate edge ID'))).toBe(true);
  });

  // Test 16: Invalid endpoint reference
  it('16. Detects invalid node reference in edge', () => {
    const invalidData = {
      building: 'Missing Node Lab',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 10, y: 10 },
        { id: 'E1', label: 'Exit', type: 'exit', x: 30, y: 30 },
      ],
      edges: [{ id: 'E1', from: 'R1', to: 'NON_EXISTENT', cost: 5 }],
    };
    const res = validateBuildingData(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('does not exist'))).toBe(true);
  });

  // Test 17: Invalid node type
  it('17. Detects invalid node type', () => {
    const invalidData = {
      building: 'Bad Type Lab',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'hallway_zone', x: 10, y: 10 },
        { id: 'E1', label: 'Exit', type: 'exit', x: 30, y: 30 },
      ],
      edges: [{ id: 'E1', from: 'R1', to: 'E1', cost: 5 }],
    };
    const res = validateBuildingData(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('invalid type'))).toBe(true);
  });

  // Test 18: Invalid initial state (e.g. exit in blocked_nodes)
  it('18. Detects invalid initial state (exit in blocked_nodes)', () => {
    const invalidData = {
      building: 'Bad State Lab',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 10, y: 10 },
        { id: 'E1', label: 'Exit', type: 'exit', x: 30, y: 30 },
      ],
      edges: [{ id: 'E1', from: 'R1', to: 'E1', cost: 5 }],
      initial_state: {
        blocked_nodes: ['E1'], // Exits cannot be in blocked_nodes
        closed_exits: [],
        blocked_edges: [],
      },
    };
    const res = validateBuildingData(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('Exits cannot be listed in "blocked_nodes"'))).toBe(true);
  });

  // Test 19: Positive-cost validation
  it('19. Detects zero or negative edge costs', () => {
    const invalidData = {
      building: 'Negative Cost Lab',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 10, y: 10 },
        { id: 'E1', label: 'Exit', type: 'exit', x: 30, y: 30 },
      ],
      edges: [{ id: 'E1', from: 'R1', to: 'E1', cost: -3 }],
    };
    const res = validateBuildingData(invalidData);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.includes('positive integer'))).toBe(true);
  });

  // Test 20: Reset restores exact initial state
  it('20. Reset restoration preserves exact initial state', () => {
    const dataWithInitialState: BuildingGraphData = {
      building: 'Test Hall',
      nodes: [
        { id: 'R1', label: 'Room 1', type: 'room', x: 10, y: 10 },
        { id: 'C1', label: 'Corridor 1', type: 'junction', x: 20, y: 20 },
        { id: 'E1', label: 'Exit 1', type: 'exit', x: 30, y: 30 },
      ],
      edges: [
        { id: 'E1', from: 'R1', to: 'C1', cost: 2 },
        { id: 'E2', from: 'C1', to: 'E1', cost: 3 },
      ],
      initial_state: {
        blocked_nodes: ['C1'],
        blocked_edges: [],
        closed_exits: ['E1'],
      },
    };

    const resetState = createCleanHazardState({
      blockedNodes: dataWithInitialState.initial_state?.blocked_nodes,
      blockedEdges: dataWithInitialState.initial_state?.blocked_edges,
      closedExits: dataWithInitialState.initial_state?.closed_exits,
    });

    expect(resetState.blockedNodes.has('C1')).toBe(true);
    expect(resetState.closedExits.has('E1')).toBe(true);
    expect(resetState.blockedEdges.size).toBe(0);

    const result = findBestRoute(dataWithInitialState, 'R1', resetState);
    // Since C1 is blocked and E1 is closed, no route is available
    expect(result.status).toBe('no-route');
  });
});
