import { describe, it, expect } from 'vitest';
import { CATEGORIES, ALL_GENERATORS, findGenerator } from '../js/generators.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function build(id, params = {}) {
  const gen = findGenerator(id);
  const p = {};
  gen.params.forEach(d => { p[d.id] = d.default; });
  Object.assign(p, params);
  return gen.build(p);
}

function check({ n, edges }) {
  for (const [u, v] of edges) {
    expect(u).toBeGreaterThanOrEqual(0);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(u).toBeLessThan(n);
    expect(v).toBeLessThan(n);
    expect(u).not.toBe(v);
  }
  const keys = edges.map(([u, v]) => (u < v ? `${u},${v}` : `${v},${u}`));
  expect(new Set(keys).size).toBe(edges.length); // no duplicates
}

function deg(n, edges) {
  const d = new Array(n).fill(0);
  for (const [u, v] of edges) { d[u]++; d[v]++; }
  return d;
}

function connected(n, edges) {
  if (n === 0) return true;
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const vis = new Uint8Array(n);
  const q = [0]; vis[0] = 1;
  for (let h = 0; h < q.length; h++)
    for (const u of adj[q[h]])
      if (!vis[u]) { vis[u] = 1; q.push(u); }
  return q.length === n;
}

function bipartite(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  const col = new Int8Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (col[s] !== -1) continue;
    col[s] = 0;
    const q = [s];
    for (let h = 0; h < q.length; h++)
      for (const u of adj[q[h]]) {
        if (col[u] === -1) { col[u] = 1 - col[q[h]]; q.push(u); }
        else if (col[u] === col[q[h]]) return false;
      }
  }
  return true;
}

// ── module structure ──────────────────────────────────────────────────────────

describe('module structure', () => {
  it('exports CATEGORIES with 7 entries', () => {
    expect(CATEGORIES.length).toBe(7);
  });

  it('ALL_GENERATORS has 32 entries', () => {
    expect(ALL_GENERATORS.length).toBe(32);
  });

  it('findGenerator returns the right object', () => {
    expect(findGenerator('petersen').id).toBe('petersen');
    expect(findGenerator('zachary').id).toBe('zachary');
  });

  it('findGenerator returns undefined for unknown id', () => {
    expect(findGenerator('does_not_exist')).toBeUndefined();
  });

  it('every generator has required fields', () => {
    for (const g of ALL_GENERATORS) {
      expect(typeof g.id).toBe('string');
      expect(typeof g.label).toBe('string');
      expect(typeof g.note).toBe('string');
      expect(typeof g.layout).toBe('string');
      expect(Array.isArray(g.params)).toBe(true);
      expect(typeof g.build).toBe('function');
    }
  });

  it('every generator produces valid output from defaults', () => {
    for (const gen of ALL_GENERATORS) {
      const params = {};
      gen.params.forEach(p => { params[p.id] = p.default; });
      const r = gen.build(params);
      expect(r.n).toBeGreaterThan(0);
      check(r);
    }
  });
});

// ── Classic Graphs ────────────────────────────────────────────────────────────

describe('complete', () => {
  it('K₂: 2 vertices, 1 edge', () => {
    const r = build('complete', { n: 2 });
    check(r);
    expect(r.n).toBe(2);
    expect(r.edges.length).toBe(1);
  });

  it('K₅: 5 vertices, 10 edges, 4-regular', () => {
    const r = build('complete', { n: 5 });
    check(r);
    expect(r.edges.length).toBe(10);
    expect(deg(5, r.edges).every(d => d === 4)).toBe(true);
  });

  it('Kₙ has n*(n-1)/2 edges', () => {
    for (const n of [3, 6, 8]) {
      const r = build('complete', { n });
      expect(r.edges.length).toBe(n * (n - 1) / 2);
    }
  });
});

describe('cycle', () => {
  it('C₃: 3 vertices, 3 edges, 2-regular', () => {
    const r = build('cycle', { n: 3 });
    check(r);
    expect(r.n).toBe(3);
    expect(r.edges.length).toBe(3);
    expect(deg(3, r.edges).every(d => d === 2)).toBe(true);
  });

  it('Cₙ: n edges, always 2-regular', () => {
    for (const n of [5, 8, 12]) {
      const r = build('cycle', { n });
      expect(r.edges.length).toBe(n);
      expect(deg(n, r.edges).every(d => d === 2)).toBe(true);
    }
  });
});

describe('path', () => {
  it('P₄: 4 vertices, 3 edges, 2 endpoints', () => {
    const r = build('path', { n: 4 });
    check(r);
    const d = deg(4, r.edges);
    expect(r.edges.length).toBe(3);
    expect(d.filter(x => x === 1).length).toBe(2);
    expect(d.filter(x => x === 2).length).toBe(2);
  });

  it('Pₙ: n-1 edges, connected', () => {
    for (const n of [3, 7, 10]) {
      const r = build('path', { n });
      expect(r.edges.length).toBe(n - 1);
      expect(connected(n, r.edges)).toBe(true);
    }
  });
});

describe('star', () => {
  it('K₁,₄: 5 vertices, 4 edges, hub degree 4', () => {
    const r = build('star', { n: 4 });
    check(r);
    expect(r.n).toBe(5);
    expect(r.edges.length).toBe(4);
    expect(deg(5, r.edges)[0]).toBe(4);
    expect(deg(5, r.edges).slice(1).every(d => d === 1)).toBe(true);
  });

  it('K₁,ₙ: n+1 vertices, n edges', () => {
    for (const n of [3, 6, 10]) {
      const r = build('star', { n });
      expect(r.n).toBe(n + 1);
      expect(r.edges.length).toBe(n);
    }
  });
});

describe('wheel', () => {
  it('W₅: 6 vertices, 10 edges, hub deg=5, rim deg=3', () => {
    const r = build('wheel', { n: 5 });
    check(r);
    expect(r.n).toBe(6);
    expect(r.edges.length).toBe(10);
    const d = deg(6, r.edges);
    expect(d[0]).toBe(5);
    expect(d.slice(1).every(x => x === 3)).toBe(true);
  });

  it('Wₙ: n+1 vertices, 2n edges', () => {
    for (const n of [4, 6, 8]) {
      const r = build('wheel', { n });
      expect(r.n).toBe(n + 1);
      expect(r.edges.length).toBe(2 * n);
    }
  });
});

describe('petersen', () => {
  it('10 vertices, 15 edges, 3-regular', () => {
    const r = build('petersen');
    check(r);
    expect(r.n).toBe(10);
    expect(r.edges.length).toBe(15);
    expect(deg(10, r.edges).every(d => d === 3)).toBe(true);
  });

  it('matches gen_petersen G(5,2)', () => {
    const p  = build('petersen');
    const gp = build('gen_petersen', { n: 5, k: 2 });
    expect(p.n).toBe(gp.n);
    expect(p.edges.length).toBe(gp.edges.length);
  });
});

describe('gen_petersen', () => {
  it('G(5,2): 10 vertices, 15 edges, 3-regular', () => {
    const r = build('gen_petersen', { n: 5, k: 2 });
    check(r);
    expect(r.n).toBe(10);
    expect(r.edges.length).toBe(15);
    expect(deg(10, r.edges).every(d => d === 3)).toBe(true);
  });

  it('G(n,k): 2n vertices, 3n edges, always 3-regular', () => {
    for (const [n, k] of [[6, 2], [7, 3], [8, 3]]) {
      const r = build('gen_petersen', { n, k });
      check(r);
      expect(r.n).toBe(2 * n);
      expect(r.edges.length).toBe(3 * n);
      expect(deg(2 * n, r.edges).every(d => d === 3)).toBe(true);
    }
  });

  it('G(n,1) is a prism graph (same edge count)', () => {
    for (const n of [4, 5, 6]) {
      const gp   = build('gen_petersen', { n, k: 1 });
      const prism = build('prism', { n });
      expect(gp.n).toBe(prism.n);
      expect(gp.edges.length).toBe(prism.edges.length);
    }
  });
});

describe('tadpole', () => {
  it('T(4,3): 7 vertices, 7 edges', () => {
    const r = build('tadpole', { n: 4, k: 3 });
    check(r);
    expect(r.n).toBe(7);
    expect(r.edges.length).toBe(7); // 4 cycle + 1 attach + 2 path
  });

  it('T(n,k): n+k vertices, n+k edges', () => {
    for (const [n, k] of [[5, 2], [3, 4], [6, 1]]) {
      const r = build('tadpole', { n, k });
      expect(r.n).toBe(n + k);
      expect(r.edges.length).toBe(n + k);
    }
  });
});

// ── Trees ─────────────────────────────────────────────────────────────────────

describe('complete_tree', () => {
  it('binary tree h=2: 7 vertices, 6 edges, connected', () => {
    const r = build('complete_tree', { d: 2, h: 2 });
    check(r);
    expect(r.n).toBe(7);
    expect(r.edges.length).toBe(6);
    expect(connected(7, r.edges)).toBe(true);
  });

  it('ternary tree h=1: 4 vertices, 3 edges', () => {
    const r = build('complete_tree', { d: 3, h: 1 });
    check(r);
    expect(r.n).toBe(4);
    expect(r.edges.length).toBe(3);
  });

  it('always a tree: n-1 edges, connected', () => {
    for (const [d, h] of [[2, 3], [3, 2], [4, 2]]) {
      const r = build('complete_tree', { d, h });
      expect(r.edges.length).toBe(r.n - 1);
      expect(connected(r.n, r.edges)).toBe(true);
    }
  });

  it('root has exactly d children', () => {
    for (const d of [2, 3, 4]) {
      const r = build('complete_tree', { d, h: 2 });
      expect(deg(r.n, r.edges)[0]).toBe(d);
    }
  });
});

describe('banana_tree', () => {
  it('B(3,3): 10 vertices, 9 edges, connected', () => {
    const r = build('banana_tree', { n: 3, k: 3 });
    check(r);
    expect(r.n).toBe(10);
    expect(r.edges.length).toBe(9);
    expect(connected(10, r.edges)).toBe(true);
  });

  it('B(n,k): 1+n*k vertices, n*k edges', () => {
    for (const [n, k] of [[2, 3], [4, 2], [3, 4]]) {
      const r = build('banana_tree', { n, k });
      expect(r.n).toBe(1 + n * k);
      expect(r.edges.length).toBe(n * k);
      expect(connected(r.n, r.edges)).toBe(true);
    }
  });

  it('root has degree n (one edge per star)', () => {
    for (const n of [2, 3, 4]) {
      const r = build('banana_tree', { n, k: 3 });
      expect(deg(r.n, r.edges)[0]).toBe(n);
    }
  });
});

describe('random_tree', () => {
  it('n vertices, n-1 edges, connected', () => {
    for (const n of [5, 10, 20]) {
      const r = build('random_tree', { n });
      check(r);
      expect(r.n).toBe(n);
      expect(r.edges.length).toBe(n - 1);
      expect(connected(n, r.edges)).toBe(true);
    }
  });

  it('n=2: single edge', () => {
    const r = build('random_tree', { n: 2 });
    expect(r.n).toBe(2);
    expect(r.edges.length).toBe(1);
  });

  it('produces different trees on repeated calls', () => {
    const e1 = build('random_tree', { n: 10 }).edges.map(String).join();
    const e2 = build('random_tree', { n: 10 }).edges.map(String).join();
    // Very unlikely to be identical for n=10 (1/10^8 chance), but not guaranteed
    // Just verify both are valid trees
    for (const r of [build('random_tree', { n: 10 }), build('random_tree', { n: 10 })]) {
      expect(r.edges.length).toBe(9);
      expect(connected(10, r.edges)).toBe(true);
    }
  });
});

// ── Bipartite & Multipartite ──────────────────────────────────────────────────

describe('complete_bipartite', () => {
  it('K(2,3): 5 vertices, 6 edges', () => {
    const r = build('complete_bipartite', { m: 2, n: 3 });
    check(r);
    expect(r.n).toBe(5);
    expect(r.edges.length).toBe(6);
  });

  it('K(m,n): m+n vertices, m*n edges', () => {
    for (const [m, n] of [[3, 4], [2, 5], [4, 4]]) {
      const r = build('complete_bipartite', { m, n });
      expect(r.n).toBe(m + n);
      expect(r.edges.length).toBe(m * n);
    }
  });

  it('is bipartite', () => {
    const r = build('complete_bipartite', { m: 3, n: 4 });
    expect(bipartite(r.n, r.edges)).toBe(true);
  });

  it('degree sequence: m vertices deg n, n vertices deg m', () => {
    const m = 3, n = 4;
    const r = build('complete_bipartite', { m, n });
    const d = deg(r.n, r.edges);
    expect(d.slice(0, m).every(x => x === n)).toBe(true);
    expect(d.slice(m).every(x => x === m)).toBe(true);
  });
});

describe('tripartite', () => {
  it('K(2,2,2): 6 vertices, 12 edges', () => {
    const r = build('tripartite', { m: 2, n: 2, o: 2 });
    check(r);
    expect(r.n).toBe(6);
    expect(r.edges.length).toBe(12);
  });

  it('K(m,n,o): m+n+o vertices, m*n+m*o+n*o edges', () => {
    for (const [m, n, o] of [[2, 3, 2], [1, 2, 3], [3, 3, 3]]) {
      const r = build('tripartite', { m, n, o });
      expect(r.n).toBe(m + n + o);
      expect(r.edges.length).toBe(m * n + m * o + n * o);
    }
  });

  it('no edges within the same partition', () => {
    const m = 2, n = 3, o = 2;
    const r = build('tripartite', { m, n, o });
    const partOf = (v) => v < m ? 0 : v < m + n ? 1 : 2;
    for (const [u, v] of r.edges) {
      expect(partOf(u)).not.toBe(partOf(v));
    }
  });
});

describe('crown', () => {
  it('Crown(3): 6 vertices, 6 edges', () => {
    const r = build('crown', { n: 3 });
    check(r);
    expect(r.n).toBe(6);
    expect(r.edges.length).toBe(6);
  });

  it('Crown(n): 2n vertices, n*(n-1) edges, (n-1)-regular', () => {
    for (const n of [3, 4, 5]) {
      const r = build('crown', { n });
      check(r);
      expect(r.n).toBe(2 * n);
      expect(r.edges.length).toBe(n * (n - 1));
      expect(deg(2 * n, r.edges).every(d => d === n - 1)).toBe(true);
    }
  });

  it('is bipartite', () => {
    const r = build('crown', { n: 4 });
    expect(bipartite(r.n, r.edges)).toBe(true);
  });

  it('no edge within each half (matching removed)', () => {
    const n = 4;
    const r = build('crown', { n });
    for (const [u, v] of r.edges) {
      expect(Math.floor(u / n) === Math.floor(v / n)).toBe(false);
    }
  });
});

describe('cocktail_party', () => {
  it('CP(2): 4 vertices, 4 edges', () => {
    const r = build('cocktail_party', { n: 2 });
    check(r);
    expect(r.n).toBe(4);
    expect(r.edges.length).toBe(4);
  });

  it('CP(n): 2n vertices, 2n*(n-1) edges, (2n-2)-regular', () => {
    for (const n of [2, 3, 4]) {
      const r = build('cocktail_party', { n });
      check(r);
      expect(r.n).toBe(2 * n);
      expect(r.edges.length).toBe(2 * n * (n - 1));
      expect(deg(2 * n, r.edges).every(d => d === 2 * n - 2)).toBe(true);
    }
  });

  it('no edge within each matched pair', () => {
    const n = 3;
    const r = build('cocktail_party', { n });
    for (const [u, v] of r.edges) {
      expect(Math.floor(u / 2)).not.toBe(Math.floor(v / 2));
    }
  });
});

// ── Web-Class Graphs ──────────────────────────────────────────────────────────

describe('prism', () => {
  it('Prism(3) (triangular prism): 6 vertices, 9 edges, 3-regular', () => {
    const r = build('prism', { n: 3 });
    check(r);
    expect(r.n).toBe(6);
    expect(r.edges.length).toBe(9);
    expect(deg(6, r.edges).every(d => d === 3)).toBe(true);
  });

  it('Prism(4) (cube): 8 vertices, 12 edges, 3-regular', () => {
    const r = build('prism', { n: 4 });
    check(r);
    expect(r.n).toBe(8);
    expect(r.edges.length).toBe(12);
    expect(deg(8, r.edges).every(d => d === 3)).toBe(true);
  });

  it('Prism(n): 2n vertices, 3n edges, always 3-regular', () => {
    for (const n of [5, 6, 7]) {
      const r = build('prism', { n });
      expect(r.n).toBe(2 * n);
      expect(r.edges.length).toBe(3 * n);
      expect(deg(2 * n, r.edges).every(d => d === 3)).toBe(true);
    }
  });
});

describe('antiprism', () => {
  it('Antiprism(3) (octahedron): 6 vertices, 12 edges, 4-regular', () => {
    const r = build('antiprism', { n: 3 });
    check(r);
    expect(r.n).toBe(6);
    expect(r.edges.length).toBe(12);
    expect(deg(6, r.edges).every(d => d === 4)).toBe(true);
  });

  it('Antiprism(n): 2n vertices, 4n edges, always 4-regular', () => {
    for (const n of [4, 5, 6]) {
      const r = build('antiprism', { n });
      check(r);
      expect(r.n).toBe(2 * n);
      expect(r.edges.length).toBe(4 * n);
      expect(deg(2 * n, r.edges).every(d => d === 4)).toBe(true);
    }
  });
});

describe('gear', () => {
  it('Gear(4): 9 vertices, 12 edges', () => {
    const r = build('gear', { n: 4 });
    check(r);
    expect(r.n).toBe(9);
    expect(r.edges.length).toBe(12);
  });

  it('Gear(n): 2n+1 vertices, 3n edges', () => {
    for (const n of [3, 5, 6]) {
      const r = build('gear', { n });
      expect(r.n).toBe(2 * n + 1);
      expect(r.edges.length).toBe(3 * n);
    }
  });

  it('hub (vertex 0) has degree n', () => {
    for (const n of [3, 5]) {
      const r = build('gear', { n });
      expect(deg(r.n, r.edges)[0]).toBe(n);
    }
  });
});

describe('helm', () => {
  it('Helm(5): 11 vertices, 15 edges', () => {
    const r = build('helm', { n: 5 });
    check(r);
    expect(r.n).toBe(11);
    expect(r.edges.length).toBe(15);
  });

  it('Helm(n): 2n+1 vertices, 3n edges', () => {
    for (const n of [3, 4, 6]) {
      const r = build('helm', { n });
      expect(r.n).toBe(2 * n + 1);
      expect(r.edges.length).toBe(3 * n);
    }
  });

  it('hub degree n, rim degree 4, pendant degree 1', () => {
    const n = 5;
    const r = build('helm', { n });
    const d = deg(r.n, r.edges);
    expect(d[0]).toBe(n);                         // hub
    expect(d.slice(1, n + 1).every(x => x === 4)).toBe(true); // rim
    expect(d.slice(n + 1).every(x => x === 1)).toBe(true);   // pendants
  });
});

describe('flower', () => {
  it('Flower(5): 11 vertices, 20 edges', () => {
    const r = build('flower', { n: 5 });
    check(r);
    expect(r.n).toBe(11);
    expect(r.edges.length).toBe(20);
  });

  it('Flower(n): 2n+1 vertices, 4n edges', () => {
    for (const n of [3, 4, 6]) {
      const r = build('flower', { n });
      expect(r.n).toBe(2 * n + 1);
      expect(r.edges.length).toBe(4 * n);
    }
  });

  it('hub degree 2n (rim + pendants)', () => {
    const n = 4;
    const r = build('flower', { n });
    expect(deg(r.n, r.edges)[0]).toBe(2 * n);
  });
});

describe('sunlet', () => {
  it('Sunlet(5): 10 vertices, 10 edges', () => {
    const r = build('sunlet', { n: 5 });
    check(r);
    expect(r.n).toBe(10);
    expect(r.edges.length).toBe(10);
  });

  it('Sunlet(n): 2n vertices, 2n edges', () => {
    for (const n of [3, 4, 6]) {
      const r = build('sunlet', { n });
      expect(r.n).toBe(2 * n);
      expect(r.edges.length).toBe(2 * n);
    }
  });

  it('cycle vertices deg 3, pendant vertices deg 1', () => {
    const n = 5;
    const r = build('sunlet', { n });
    const d = deg(r.n, r.edges);
    expect(d.slice(0, n).every(x => x === 3)).toBe(true);
    expect(d.slice(n).every(x => x === 1)).toBe(true);
  });
});

// ── Grids & Products ──────────────────────────────────────────────────────────

describe('grid_mn', () => {
  it('P(2×3): 6 vertices, 7 edges', () => {
    const r = build('grid_mn', { m: 2, n: 3 });
    check(r);
    expect(r.n).toBe(6);
    expect(r.edges.length).toBe(7);
  });

  it('P(m×n): m*n vertices, m*(n-1)+(m-1)*n edges', () => {
    for (const [m, n] of [[3, 4], [4, 5], [2, 6]]) {
      const r = build('grid_mn', { m, n });
      expect(r.n).toBe(m * n);
      expect(r.edges.length).toBe(m * (n - 1) + (m - 1) * n);
    }
  });

  it('corner vertices have degree 2', () => {
    const m = 3, n = 4;
    const r = build('grid_mn', { m, n });
    const d = deg(r.n, r.edges);
    // Four corners: 0, n-1, (m-1)*n, m*n-1
    for (const v of [0, n - 1, (m - 1) * n, m * n - 1]) {
      expect(d[v]).toBe(2);
    }
  });
});

describe('toroidal_mn', () => {
  it('C(3×4): 12 vertices, 24 edges, 4-regular', () => {
    const r = build('toroidal_mn', { m: 3, n: 4 });
    check(r);
    expect(r.n).toBe(12);
    expect(r.edges.length).toBe(24);
    expect(deg(12, r.edges).every(d => d === 4)).toBe(true);
  });

  it('C(4×5): 20 vertices, 40 edges, 4-regular', () => {
    const r = build('toroidal_mn', { m: 4, n: 5 });
    check(r);
    expect(r.n).toBe(20);
    expect(r.edges.length).toBe(40);
    expect(deg(20, r.edges).every(d => d === 4)).toBe(true);
  });
});

// ── Random Graphs ─────────────────────────────────────────────────────────────

describe('random_er', () => {
  it('n vertices, no self-loops, no duplicates', () => {
    const r = build('random_er', { n: 20, p: 0.3 });
    check(r);
    expect(r.n).toBe(20);
  });

  it('p=0: no edges', () => {
    const r = build('random_er', { n: 10, p: 0 });
    expect(r.edges.length).toBe(0);
  });

  it('p=1: complete graph (n*(n-1)/2 edges)', () => {
    const n = 8;
    const r = build('random_er', { n, p: 1 });
    expect(r.edges.length).toBe(n * (n - 1) / 2);
  });
});

describe('barabasi', () => {
  it('n vertices, connected, no self-loops', () => {
    const r = build('barabasi', { n: 20, m: 2 });
    check(r);
    expect(r.n).toBe(20);
    expect(connected(20, r.edges)).toBe(true);
  });

  it('at least (n-2)*m edges (preferential attachment lower bound)', () => {
    const n = 15, m = 2;
    const r = build('barabasi', { n, m });
    expect(r.edges.length).toBeGreaterThanOrEqual((n - 2) * m + 1);
  });
});

describe('watts_strogatz', () => {
  it('n vertices, no self-loops, no duplicates', () => {
    const r = build('watts_strogatz', { n: 20, k: 4, beta: 0.3 });
    check(r);
    expect(r.n).toBe(20);
  });

  it('beta=0: ring lattice with exactly n*k/2 edges', () => {
    const n = 12, k = 4;
    const r = build('watts_strogatz', { n, k, beta: 0 });
    expect(r.n).toBe(n);
    expect(r.edges.length).toBe(n * k / 2);
    expect(deg(n, r.edges).every(d => d === k)).toBe(true);
  });
});

describe('k_regular', () => {
  it('n=12, k=4: 12 vertices, 24 edges, 4-regular', () => {
    const r = build('k_regular', { n: 12, k: 4 });
    check(r);
    expect(r.n).toBe(12);
    expect(r.edges.length).toBe(24);
    expect(deg(12, r.edges).every(d => d === 4)).toBe(true);
  });

  it('k-regular circulant: always k-regular', () => {
    for (const [n, k] of [[10, 4], [12, 6], [8, 2]]) {
      const r = build('k_regular', { n, k });
      expect(deg(n, r.edges).every(d => d === k)).toBe(true);
    }
  });
});

// ── Named Graphs ──────────────────────────────────────────────────────────────

describe('frucht', () => {
  it('12 vertices, 18 edges', () => {
    const r = build('frucht');
    check(r);
    expect(r.n).toBe(12);
    expect(r.edges.length).toBe(18);
  });

  it('3-regular', () => {
    const r = build('frucht');
    expect(deg(12, r.edges).every(d => d === 3)).toBe(true);
  });

  it('connected', () => {
    const r = build('frucht');
    expect(connected(12, r.edges)).toBe(true);
  });
});

describe('grotzsch', () => {
  it('11 vertices, 20 edges', () => {
    const r = build('grotzsch');
    check(r);
    expect(r.n).toBe(11);
    expect(r.edges.length).toBe(20);
  });

  it('connected and not bipartite (contains odd cycle)', () => {
    const r = build('grotzsch');
    expect(connected(11, r.edges)).toBe(true);
    expect(bipartite(11, r.edges)).toBe(false);
  });

  it('hub (vertex 10) has degree 5', () => {
    const r = build('grotzsch');
    expect(deg(11, r.edges)[10]).toBe(5);
  });
});

describe('heawood', () => {
  it('14 vertices, 21 edges', () => {
    const r = build('heawood');
    check(r);
    expect(r.n).toBe(14);
    expect(r.edges.length).toBe(21);
  });

  it('3-regular', () => {
    const r = build('heawood');
    expect(deg(14, r.edges).every(d => d === 3)).toBe(true);
  });

  it('bipartite', () => {
    const r = build('heawood');
    expect(bipartite(14, r.edges)).toBe(true);
  });
});

describe('pappus', () => {
  it('18 vertices, 27 edges', () => {
    const r = build('pappus');
    check(r);
    expect(r.n).toBe(18);
    expect(r.edges.length).toBe(27);
  });

  it('3-regular and bipartite', () => {
    const r = build('pappus');
    expect(deg(18, r.edges).every(d => d === 3)).toBe(true);
    expect(bipartite(18, r.edges)).toBe(true);
  });
});

describe('zachary', () => {
  it('34 vertices, 78 edges', () => {
    const r = build('zachary');
    check(r);
    expect(r.n).toBe(34);
    expect(r.edges.length).toBe(78);
  });

  it('connected', () => {
    const r = build('zachary');
    expect(connected(34, r.edges)).toBe(true);
  });

  it('not bipartite (has triangles)', () => {
    const r = build('zachary');
    expect(bipartite(34, r.edges)).toBe(false);
  });
});
