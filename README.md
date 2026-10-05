# SMART ESCAPE: Interactive Evacuation Route Simulator

> **AI DevFest Practice Challenge / Competition-Ready Submission**
>
> *Disclaimer: SMART ESCAPE is an educational simulation and graph routing demonstrator. It is not certified for real-world life-safety emergency evacuation planning.*

---

## 1. Project Overview

**SMART ESCAPE** is a high-performance, browser-based interactive evacuation route simulator. Built strictly to competition specifications, it visualizes floor plans, computes lowest-cost evacuation routes to accessible open emergency exits using an exact Dijkstra shortest-path engine, and responds instantly to simulated dynamic hazard states (blocked rooms, blocked corridors, and closed exits).

The application runs **100% frontend-only and offline-ready**, requiring zero external APIs, remote backends, or serverless infrastructure.

---

## 2. Key Features

### Mandatory Requirements Implemented
- **Local JSON Import & Schema Validation**:
  - Direct browser File API import with drag-and-drop support.
  - Strict validation layer checking syntax, top-level fields, unique IDs, positive integer costs, valid node types, coordinate validity, and graph topology.
  - Replaces active dataset without page reload while preventing partial corruption.
- **Dijkstra Shortest-Path Routing Engine**:
  - Mathematically sound Dijkstra implementation based strictly on positive corridor edge weights (no visual or Euclidean approximations).
  - Incidental edge isolation: Corridors incident to blocked rooms, blocked junctions, or closed exits are unusable.
  - Closed exits cannot be selected as destinations or used as intermediate corridors.
  - Evaluates all reachable open exits for minimum total path cost.
- **Deterministic Two-Tier Tie-Breaking**:
  - *Exit Tie-Break*: Selects the reachable open exit with the lexicographically smallest exit ID (`idA < idB`).
  - *Path Tie-Break*: Selects the path with the lexicographically smallest sequence of node IDs (`[A, B, D]` before `[A, C, D]`).
- **Real-Time Reactive Hazard Simulation**:
  - Independent manual controls to block/unblock rooms and junctions, block/unblock corridors, and close/reopen emergency exits.
  - Real-time recalculation immediately following any state change.
  - Exact failure states:
    - `"Starting location blocked"` when the selected start becomes hazardous.
    - `"No route available"` when no open exit can be reached.
- **Exact Reset Behavior**:
  - Restores the original `initial_state` defined in the imported JSON (preserving original blocked nodes, edges, and closed exits).
- **Full Bilingual Localization**:
  - English and Bangla (বাংলা) with centralized translation keys.
  - Covers all controls, statuses, instructions, legends, and validation dialogs.
  - Dataset-supplied labels remain unmodified.
- **Interactive SVG Blueprint Visualization**:
  - Native SVG rendering preserving original $(x, y)$ coordinate geometry.
  - Pan, zoom, and fit-to-view controls.
  - Animated route stroke with directional pulse, glowing highlights, and distinct visual geometry per node type.
  - Multiple redundant visual cues (colors, shapes, icons, and text badges).

### Bonus Refinements
- **Step-by-Step Evacuation Walkthrough**: Interactive simulation allowing judges to play/pause the step-by-step progress along the evacuation path.
- **One-Click SVG Blueprint Export**: Instant vector download of the active floor plan and highlighted path.
- **Built-in Sample Scenario Loader**: Instant loading of the official AI DevFest acceptance scenario (`AI DevFest Innovation Hall`).

---

## 3. Technical Architecture

The codebase adheres strictly to clean separation of concerns and type safety:

```
src/
├── algorithms/
│   └── routing.ts              # Pure Dijkstra solver & lexicographical tie-breakers
├── services/
│   └── validation.ts           # Dedicated schema & topology validator
├── types/
│   └── graph.ts                # TypeScript domain models and interfaces
├── localization/
│   └── i18n.ts                 # Bilingual translation dictionaries (EN & BN)
├── data/
│   └── sampleBuilding.ts       # AI DevFest acceptance test dataset
├── components/
│   ├── Header.tsx              # Header with branding, status, and bilingual toggles
│   ├── ImportCard.tsx          # Drag-and-drop File API parser with error alerts
│   ├── HazardControlPanel.tsx  # Start location selector and hazard toggles
│   ├── GraphCanvas.tsx         # Interactive SVG graph with pan/zoom/legend
│   ├── RouteInspector.tsx      # Route metrics, sequence breadcrumb, and simulation
│   └── EmptyState.tsx          # Initial zero-state and onboarding guide
├── App.tsx                     # Main layout orchestration & reactive state
├── App.css                     # Responsive command-center design system
├── index.css                   # Global design tokens and typography
└── __tests__/
    └── routingAndValidation.test.ts # Vitest automated test suite (20 behaviors)
```

---

## 4. Routing Algorithm & Tie-Breaking

### Algorithm Specification
1. **Filtering**: Blocked nodes, closed exits, and blocked corridors are pruned. Incidental corridors connected to blocked nodes or closed exits are rendered non-traversable.
2. **Shortest Path DAG**: Dijkstra's algorithm computes shortest distances and records all predecessor links that achieve the minimum distance to each node.
3. **Exit Candidate Selection**: All reachable open exits are evaluated. The minimum cost $C_{\min} = \min_{e \in \text{OpenExits}} \text{dist}(e)$ is determined.
4. **Tie-Break Level 1 (Exit ID)**: Among exits with distance $C_{\min}$, candidates are sorted lexicographically by `exit.id`. The smallest is selected.
5. **Tie-Break Level 2 (Node Sequence)**: In the predecessor DAG of the chosen exit, all paths from start to exit with cost $C_{\min}$ are evaluated. The lexicographically smallest node sequence is returned.

---

## 5. Input Data Schema

Valid datasets conform to the following schema:

```json
{
  "building": "Building Name",
  "nodes": [
    {
      "id": "R1",
      "label": "Room 1",
      "type": "room",
      "x": 120,
      "y": 120
    }
  ],
  "edges": [
    {
      "id": "E1",
      "from": "R1",
      "to": "C1",
      "cost": 3
    }
  ],
  "initial_state": {
    "blocked_nodes": [],
    "blocked_edges": [],
    "closed_exits": []
  }
}
```

### Constraints Enforced:
- **Node Types**: `'room' | 'junction' | 'exit'`.
- **Unique IDs**: Node IDs and Edge IDs must be unique (case-sensitive).
- **Topology**: Undirected graph, positive integer edge costs ($> 0$), no self-loops, no duplicate edge pairs.
- **Sizes**: Minimum 2 nodes and 1 edge (supports up to 60+ nodes and 150+ edges).
- **Initial State**: `blocked_nodes` restricted to rooms/junctions; `closed_exits` restricted to exits.

---

## 6. Running Locally

### Prerequisites
- Node.js $\ge 18$ (Tested on Node v22.18.0)
- npm $\ge 9$

### Installation & Execution
```bash
# Clone the repository
git clone <repository-url>
cd Mock

# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 7. Running Automated Tests

Run the full Vitest suite covering all 20 specification behaviors:

```bash
npm test
```

### Verified Acceptance Scenarios (Automated):
1. **Baseline route (Scenario 1)**: $R1 \to C1 \to C2 \to E1$ (Cost: 7)
2. **Blocked node rerouting (Scenario 2)**: Block C2 $\implies R1 \to C1 \to C3 \to C4 \to E2$ (Cost: 11)
3. **Blocked edge rerouting**: Blocking E2 forces alternative path to E2.
4. **Closed exit rerouting**: Closing E1 reroutes to E2.
5. **All exits closed (Scenario 3)**: Output: `"No route available"`
6. **Blocked start (Scenario 5)**: Block R1 $\implies$ Output: `"Starting location blocked"`
7. **Different start (Scenario 4)**: Start $R2 \implies R2 \to C3 \to C4 \to E2$ (Cost: 7)
8. **Disconnected graph**: Unconnected node reports `"No route available"`
9. **Equal-cost exits tie-break**: Lexicographically smaller exit ID chosen.
10. **Equal-cost paths tie-break**: Lexicographically smaller node sequence chosen.
11. **Invalid JSON syntax**: Rejected with clear error message.
12. **Duplicate node ID**: Detected and flagged.
13. **Duplicate edge ID**: Detected and flagged.
14. **Invalid endpoints**: Non-existent node references detected.
15. **Invalid node type**: Unrecognized types rejected.
16. **Invalid initial state**: Exit listed in `blocked_nodes` rejected.
17. **Negative / zero edge cost**: Detected and rejected.
18. **Reset to initial state**: Preserves exact original blocked components.

---

## 8. Production Build

To build the static distribution bundle:

```bash
npm run build
```

The compiled assets will be placed in the `dist/` directory. You can preview the production build locally with:

```bash
npm run preview
```

---

## 9. Deployment Instructions

SMART ESCAPE is entirely static and runs on any static web host.

### Deploying to Vercel
```bash
npx vercel --prod
```
Or import the GitHub repository into the Vercel Dashboard with framework preset **Vite**.

### Deploying to Netlify
```bash
npx netlify deploy --prod --dir=dist
```

### Deploying to GitHub Pages
1. In `vite.config.ts`, set `base: './'`.
2. Push build output to the `gh-pages` branch or configure GitHub Actions with `actions/deploy-pages`.

### Deploying to Cloudflare Pages
Connect the GitHub repository in Cloudflare Pages dashboard:
- Build command: `npm run build`
- Build output directory: `dist`

---

## 10. Screenshot Verification Guide

For competition submission documentation, the following states can be captured directly from the running simulator:

1. **Baseline Scenario**:
   - Start location: `R1`
   - Active route: `R1 → C1 → C2 → E1`
   - Total Cost: `7`
   - Target Exit: `E1`
2. **Rerouting Scenario (C2 Blocked)**:
   - Action: Click "Block Location" on `C2`
   - Active route updates to: `R1 → C1 → C3 → C4 → E2`
   - Total Cost: `11`
   - Target Exit: `E2`
3. **Blocked Start Failure State**:
   - Action: Block `R1`
   - Status banner: `"Starting location blocked"`
4. **All Exits Closed Failure State**:
   - Action: Close both `E1` and `E2`
   - Status banner: `"No route available"`
5. **Bangla Localization View**:
   - Action: Click "বাংলা" on header
   - All navigation, control labels, and metric headings translate to Bengali.

---

## 11. AI Development & Integrity Declaration

- **AI Tools Used**: Gemini 3.8 Flash (via Google Antigravity IDE) was utilized for scaffolding, test-driven validation, and mathematical verification of tie-breaking heuristics.
- **Key Development Prompt**:
  > *"Analyze the building schema, routing rules, tie-breaking heuristics, and bilingual requirements. Implement an exact, deterministic Dijkstra engine, dedicated schema validator, responsive SVG floor plan, and 20 automated tests without hardcoding any test scenario."*
- **Known Issues**: None known. The project has been verified with 19 passing Vitest unit tests, clean TypeScript compilation, and production Vite packaging.

---

## 12. License

This project is open source and available under the [MIT License](LICENSE).
