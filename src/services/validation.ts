import type { BuildingGraphData, BuildingNode, BuildingEdge, ValidationResult } from '../types/graph';

/**
 * Validates a parsed JSON object or raw JSON string against the Smart Escape building schema.
 * Returns structured validation messages explaining any schema or integrity violations.
 */
export function validateBuildingData(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: ['Invalid root: The building dataset must be a JSON object.'],
    };
  }

  const raw = input as Record<string, unknown>;

  // 1. Building Name
  if (typeof raw.building !== 'string' || raw.building.trim().length === 0) {
    errors.push('Missing or invalid "building": A non-empty building name string is required.');
  }

  // 2. Nodes Array
  if (!Array.isArray(raw.nodes)) {
    errors.push('Missing or invalid "nodes": Expected an array of node objects.');
  }

  // 3. Edges Array
  if (!Array.isArray(raw.edges)) {
    errors.push('Missing or invalid "edges": Expected an array of edge objects.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const rawNodes = raw.nodes as unknown[];
  const rawEdges = raw.edges as unknown[];

  // Size constraints per specification (approx 2-60 nodes, 1-150 edges)
  if (rawNodes.length < 2) {
    errors.push(`A valid building graph must contain at least 2 nodes (found ${rawNodes.length}).`);
  }
  if (rawNodes.length > 100) {
    errors.push(`Building graph exceeds maximum node limit (found ${rawNodes.length}, max recommended is 60).`);
  }

  if (rawEdges.length < 1) {
    errors.push(`A valid building graph must contain at least 1 edge (found ${rawEdges.length}).`);
  }
  if (rawEdges.length > 200) {
    errors.push(`Building graph exceeds maximum edge limit (found ${rawEdges.length}, max recommended is 150).`);
  }

  // Validate nodes
  const nodeMap = new Map<string, BuildingNode>();
  let roomOrJunctionCount = 0;
  let exitCount = 0;

  for (let i = 0; i < rawNodes.length; i++) {
    const n = rawNodes[i];
    if (n === null || typeof n !== 'object' || Array.isArray(n)) {
      errors.push(`Node at index ${i} is not a valid object.`);
      continue;
    }
    const nodeObj = n as Record<string, unknown>;

    if (typeof nodeObj.id !== 'string' || nodeObj.id.trim().length === 0) {
      errors.push(`Node at index ${i} is missing a non-empty string "id".`);
      continue;
    }
    const id = nodeObj.id;

    if (nodeMap.has(id)) {
      errors.push(`Duplicate node ID detected: "${id}" is used more than once.`);
    }

    if (typeof nodeObj.label !== 'string') {
      errors.push(`Node "${id}" is missing a string "label".`);
    }

    const type = nodeObj.type;
    if (type !== 'room' && type !== 'junction' && type !== 'exit') {
      errors.push(`Node "${id}" has invalid type "${String(type)}". Must be 'room', 'junction', or 'exit'.`);
    } else {
      if (type === 'room' || type === 'junction') {
        roomOrJunctionCount++;
      } else if (type === 'exit') {
        exitCount++;
      }
    }

    if (typeof nodeObj.x !== 'number' || !Number.isFinite(nodeObj.x)) {
      errors.push(`Node "${id}" has invalid coordinate x: must be a finite number.`);
    }
    if (typeof nodeObj.y !== 'number' || !Number.isFinite(nodeObj.y)) {
      errors.push(`Node "${id}" has invalid coordinate y: must be a finite number.`);
    }

    nodeMap.set(id, {
      id,
      label: String(nodeObj.label ?? id),
      type: type as BuildingNode['type'],
      x: Number(nodeObj.x ?? 0),
      y: Number(nodeObj.y ?? 0),
    });
  }

  if (roomOrJunctionCount === 0) {
    errors.push('Graph must contain at least one starting location (room or junction).');
  }
  if (exitCount === 0) {
    errors.push('Graph must contain at least one exit.');
  }

  // Validate edges
  const edgeMap = new Map<string, BuildingEdge>();
  const seenPairs = new Set<string>();

  for (let i = 0; i < rawEdges.length; i++) {
    const e = rawEdges[i];
    if (e === null || typeof e !== 'object' || Array.isArray(e)) {
      errors.push(`Edge at index ${i} is not a valid object.`);
      continue;
    }
    const edgeObj = e as Record<string, unknown>;

    if (typeof edgeObj.id !== 'string' || edgeObj.id.trim().length === 0) {
      errors.push(`Edge at index ${i} is missing a non-empty string "id".`);
      continue;
    }
    const id = edgeObj.id;

    if (edgeMap.has(id)) {
      errors.push(`Duplicate edge ID detected: "${id}" is used more than once.`);
    }

    const from = edgeObj.from;
    const to = edgeObj.to;

    if (typeof from !== 'string' || !nodeMap.has(from)) {
      errors.push(`Edge "${id}" has invalid "from" reference "${String(from)}": node does not exist.`);
    }
    if (typeof to !== 'string' || !nodeMap.has(to)) {
      errors.push(`Edge "${id}" has invalid "to" reference "${String(to)}": node does not exist.`);
    }

    if (typeof from === 'string' && typeof to === 'string') {
      if (from === to) {
        errors.push(`Edge "${id}" is a self-loop from "${from}" to itself, which is prohibited.`);
      }

      // Check for repeated undirected pairs
      const pairKey = from < to ? `${from}__${to}` : `${to}__${from}`;
      if (seenPairs.has(pairKey)) {
        errors.push(`Repeated edge connection detected between "${from}" and "${to}".`);
      } else {
        seenPairs.add(pairKey);
      }
    }

    const cost = edgeObj.cost;
    if (typeof cost !== 'number' || !Number.isInteger(cost) || cost <= 0) {
      errors.push(`Edge "${id}" has invalid cost (${String(cost)}): must be a positive integer greater than 0.`);
    }

    edgeMap.set(id, {
      id,
      from: String(from),
      to: String(to),
      cost: Number(cost),
    });
  }

  // Validate initial_state if provided
  const initialState = raw.initial_state;
  let parsedInitialState = undefined;

  if (initialState !== undefined && initialState !== null) {
    if (typeof initialState !== 'object' || Array.isArray(initialState)) {
      errors.push('Optional "initial_state" must be an object if present.');
    } else {
      const stateObj = initialState as Record<string, unknown>;

      const blockedNodes: string[] = [];
      const blockedEdges: string[] = [];
      const closedExits: string[] = [];

      if (stateObj.blocked_nodes !== undefined) {
        if (!Array.isArray(stateObj.blocked_nodes)) {
          errors.push('"initial_state.blocked_nodes" must be an array of node IDs.');
        } else {
          for (const nid of stateObj.blocked_nodes) {
            if (typeof nid !== 'string') {
              errors.push(`Invalid blocked node reference: ${String(nid)}.`);
              continue;
            }
            const targetNode = nodeMap.get(nid);
            if (!targetNode) {
              errors.push(`Blocked node "${nid}" specified in initial_state does not exist in graph.`);
            } else if (targetNode.type === 'exit') {
              errors.push(`Blocked node "${nid}" is an exit. Exits cannot be listed in "blocked_nodes"; use "closed_exits" instead.`);
            } else {
              blockedNodes.push(nid);
            }
          }
        }
      }

      if (stateObj.closed_exits !== undefined) {
        if (!Array.isArray(stateObj.closed_exits)) {
          errors.push('"initial_state.closed_exits" must be an array of exit node IDs.');
        } else {
          for (const xid of stateObj.closed_exits) {
            if (typeof xid !== 'string') {
              errors.push(`Invalid closed exit reference: ${String(xid)}.`);
              continue;
            }
            const targetNode = nodeMap.get(xid);
            if (!targetNode) {
              errors.push(`Closed exit "${xid}" specified in initial_state does not exist in graph.`);
            } else if (targetNode.type !== 'exit') {
              errors.push(`Closed exit "${xid}" is of type "${targetNode.type}". Only exits can be listed in "closed_exits".`);
            } else {
              closedExits.push(xid);
            }
          }
        }
      }

      if (stateObj.blocked_edges !== undefined) {
        if (!Array.isArray(stateObj.blocked_edges)) {
          errors.push('"initial_state.blocked_edges" must be an array of edge IDs.');
        } else {
          for (const eid of stateObj.blocked_edges) {
            if (typeof eid !== 'string') {
              errors.push(`Invalid blocked edge reference: ${String(eid)}.`);
              continue;
            }
            if (!edgeMap.has(eid)) {
              errors.push(`Blocked edge "${eid}" specified in initial_state does not exist in graph.`);
            } else {
              blockedEdges.push(eid);
            }
          }
        }
      }

      parsedInitialState = {
        blocked_nodes: blockedNodes,
        blocked_edges: blockedEdges,
        closed_exits: closedExits,
      };
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  const validData: BuildingGraphData = {
    building: String(raw.building).trim(),
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    initial_state: parsedInitialState ?? {
      blocked_nodes: [],
      blocked_edges: [],
      closed_exits: [],
    },
  };

  return {
    isValid: true,
    errors: [],
    data: validData,
  };
}

/**
 * Parses raw JSON string and passes to validateBuildingData.
 */
export function parseAndValidateBuildingJSON(rawJsonString: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJsonString);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      errors: [`JSON Syntax Error: Malformed JSON file. ${errorMsg}`],
    };
  }

  return validateBuildingData(parsed);
}
