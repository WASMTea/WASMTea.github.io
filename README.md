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

---

## Tech stack

- **Rust + wasm-bindgen** — graph engine and algorithms (2D editor)
- **Three.js** — 3D rendering (large graph view)
- **ngraph.forcelayout** — force-directed layout (large graph view)
- **HTML5 Canvas** — 2D rendering
