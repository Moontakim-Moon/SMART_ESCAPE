import type { BuildingGraphData } from '../types/graph';
import { sampleBuildingData } from './sampleBuilding';

export interface SamplePreset {
  id: string;
  name: string;
  filename: string;
  description: string;
  data?: BuildingGraphData;
}

export const samplePresets: SamplePreset[] = [
  {
    id: '01-devfest',
    name: '1. AI DevFest Innovation Hall (Baseline)',
    filename: '01-devfest-official-hall.json',
    description: 'Official 8-node test scenario satisfying Scenarios 1 to 5.',
    data: sampleBuildingData,
  },
  {
    id: '02-hospital',
    name: '2. Apex Memorial Hospital (12 Nodes, 3 Exits)',
    filename: '02-hospital-wing.json',
    description: 'Multi-corridor healthcare ward with 3 emergency exits.',
  },
  {
    id: '03-tie-breaker',
    name: '3. Mathematical Tie-Breaker Arena',
    filename: '03-tie-breaker-arena.json',
    description: 'Exact equal-cost routes testing exit ID & node sequence tie-breaking.',
  },
  {
    id: '04-tech-campus',
    name: '4. Quantum Robotics Tech Campus (15 Nodes)',
    filename: '04-high-density-tech-campus.json',
    description: 'Dense campus floor plan with perimeter gates and central atrium hub.',
  },
  {
    id: '05-bunker',
    name: '5. Subterranean Bunker (Pre-blocked Choke Points)',
    filename: '05-bottleneck-choke-point.json',
    description: 'Deep archive bunker with pre-blocked tunnel in initial_state.',
  },
  {
    id: '06-invalid',
    name: '6. Invalid Schema Demo (Tests Validation Errors)',
    filename: '06-invalid-syntax-and-rules-demo.json',
    description: 'Intentionally malformed dataset to demonstrate error dialogs.',
  },
];
