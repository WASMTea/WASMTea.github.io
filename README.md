# WASMTea

A browser-based graph editing and analysis framework built with Rust and WebAssembly.

Live at: **[wasmtea.github.io](https://wasmtea.github.io)**

Source code: [github.com/rostam/WASMTea](https://github.com/rostam/WASMTea)

---

## Pages

### [Graph Editor](graph.html)
Interactive 2D graph editor powered by a Rust/WASM engine.

- Add vertices and edges with the mouse
- Move and delete with dedicated tools
- Generate preset graphs (Complete, Cycle, Path, Star, Wheel, Petersen, Bipartite, Grid)
- Analysis sidebar: connectivity, bipartite check, Eulerian paths, diameter, chromatic number, maximum independent set, minimum vertex cover, maximum clique

### [Large Graph — 3D](large-graph.html)
Force-directed 3D graph viewer for large graphs.

- 3D layout via `ngraph.forcelayout` (no build step, loaded from CDN)
- Rotate and zoom with mouse
- Generators: Random (Erdős–Rényi), Barabási–Albert, and all standard types — up to 500 vertices
- Live physics controls (spring, gravity, drag)

### [Conjecture Checker](conjecture.html)
Batch graph analysis tool for exploring and testing graph-theoretic conjectures.

**Graph sources**
- Upload a `.g6` file (McKay Graph6 format) — each line is one graph
- Generator sweep — choose a graph type and specify parameter ranges; the tool enumerates every combination (Cartesian product)

**Metrics**
Over 40 graph metrics organised in collapsible groups:
- *Basic* — order, size, density, degree sequence, min/max/avg degree
- *Connectivity* — components, connectivity, bipartiteness, tree/forest checks
- *Paths & distances* — diameter, radius, Wiener index, average distance
- *Spectral* — largest adjacency eigenvalue, algebraic connectivity (Fiedler value)
- *Coloring* — chromatic number, clique number, independence number
- *Centrality* — max betweenness, max closeness, max eccentricity
- *Structural* — girth, matching number, vertex/edge cover, domination number

**Conjecture expression**
Write any JavaScript expression using metric names as variables (e.g. `wiener <= n*(n-1)/2`). Rows are highlighted green when the expression holds and red when a counterexample is found.

**Output**
Results table with one row per graph showing the G6 string and all selected metric values. Download the full dataset as CSV at any time.

---

## Tech stack

- **Rust + wasm-bindgen** — graph engine and algorithms (2D editor)
- **Three.js** — 3D rendering (large graph view)
- **ngraph.forcelayout** — force-directed layout (large graph view)
- **HTML5 Canvas** — 2D rendering
