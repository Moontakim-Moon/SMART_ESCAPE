export type NodeType = 'room' | 'junction' | 'exit';

export interface BuildingNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}

export interface BuildingEdge {
  id: string;
  from: string;
  to: string;
  cost: number;
}

export interface InitialState {
  blocked_nodes?: string[];
  blocked_edges?: string[];
  closed_exits?: string[];
}

export interface BuildingGraphData {
  building: string;
  nodes: BuildingNode[];
  edges: BuildingEdge[];
  initial_state?: InitialState;
}

export interface HazardState {
  blockedNodes: Set<string>;
  blockedEdges: Set<string>;
  closedExits: Set<string>;
}

export type RouteStatus = 'ok' | 'no-route' | 'start-blocked';

export interface RouteResult {
  status: RouteStatus;
  start?: string;
  exit?: string;
  path?: string[];
  cost?: number;
  evaluatedExitsCount?: number;
}

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: BuildingGraphData;
}
