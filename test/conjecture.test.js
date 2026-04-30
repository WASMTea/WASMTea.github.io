import { describe, it, expect } from 'vitest';
import { analyzeGraph, evalConjecture, sweepParams, sweepCount } from '../js/conjecture.js';

// ── analyzeGraph ─────────────────────────────────────────────────────────────

describe('analyzeGraph — K1 (single vertex)', () => {
  const g = analyzeGraph(1, []);
  it('n, m', () => { expect(g.n).toBe(1); expect(g.m).toBe(0); });
  it('density 0 for n≤1', () => expect(g.density).toBe(0));
  it('connected, components', () => { expect(g.connected).toBe(true); expect(g.components).toBe(1); });
  it('degree stats', () => { expect(g.minDeg).toBe(0); expect(g.maxDeg).toBe(0); expect(g.avgDeg).toBe(0); });
  it('bipartite, isTree', () => { expect(g.bipartite).toBe(true); expect(g.isTree).toBe(true); });
  it('regular (k=0)', () => expect(g.isRegular).toBe(0));
  it('no Euler circuit or path (no edges)', () => { expect(g.eulerCircuit).toBe(false); expect(g.eulerPath).toBe(false); });
  it('diameter 0 (self-loop distance)', () => expect(g.diameter).toBe(0));
  it('girth -1 (no cycle)', () => expect(g.girth).toBe(-1));
  it('triangles 0', () => expect(g.triangles).toBe(0));
  it('wiener 0 (no pairs)', () => expect(g.wiener).toBe(0));
  it('MIS 1, MVC 0, clique 1', () => { expect(g.mis).toBe(1); expect(g.mvc).toBe(0); expect(g.clique).toBe(1); });
  it('matching 0', () => expect(g.matchingSize).toBe(0));
  it('Zagreb M1=0, M2=0', () => { expect(g.m1).toBe(0); expect(g.m2).toBe(0); });
  it('chromGreedy 1', () => expect(g.chromGreedy).toBe(1));
});

describe('analyzeGraph — K2 (single edge)', () => {
  const g = analyzeGraph(2, [[0, 1]]);
  it('n=2, m=1, density=1', () => { expect(g.n).toBe(2); expect(g.m).toBe(1); expect(g.density).toBe(1); });
  it('connected', () => { expect(g.connected).toBe(true); expect(g.components).toBe(1); });
  it('degrees all 1', () => { expect(g.minDeg).toBe(1); expect(g.maxDeg).toBe(1); expect(g.avgDeg).toBe(1); });
  it('bipartite, tree', () => { expect(g.bipartite).toBe(true); expect(g.isTree).toBe(true); });
  it('1-regular', () => expect(g.isRegular).toBe(1));
  it('Euler path (two odd-degree vertices)', () => { expect(g.eulerPath).toBe(true); expect(g.eulerCircuit).toBe(false); });
  it('girth -1 (tree)', () => expect(g.girth).toBe(-1));
  it('diameter 1', () => expect(g.diameter).toBe(1));
  it('wiener 1', () => expect(g.wiener).toBe(1));
  it('MIS 1, MVC 1, clique 2', () => { expect(g.mis).toBe(1); expect(g.mvc).toBe(1); expect(g.clique).toBe(2); });
  it('matchingSize 1', () => expect(g.matchingSize).toBe(1));
  it('Zagreb M1=2, M2=1', () => { expect(g.m1).toBe(2); expect(g.m2).toBe(1); });
  it('chromGreedy 2', () => expect(g.chromGreedy).toBe(2));
  it('Hamiltonian cycle/path null for n<3', () => { expect(g.hamiltonianCycle).toBeNull(); expect(g.hamiltonianPath).toBeNull(); });
});

describe('analyzeGraph — K3 (triangle)', () => {
  const g = analyzeGraph(3, [[0, 1], [1, 2], [0, 2]]);
  it('n=3, m=3, density=1', () => { expect(g.n).toBe(3); expect(g.m).toBe(3); expect(g.density).toBe(1); });
  it('connected, 1 component', () => { expect(g.connected).toBe(true); expect(g.components).toBe(1); });
  it('degrees all 2', () => { expect(g.minDeg).toBe(2); expect(g.maxDeg).toBe(2); expect(g.avgDeg).toBe(2); });
  it('not bipartite (odd cycle)', () => expect(g.bipartite).toBe(false));
  it('not a tree (m > n-1)', () => expect(g.isTree).toBe(false));
  it('2-regular', () => expect(g.isRegular).toBe(2));
  it('Eulerian circuit (all even deg)', () => { expect(g.eulerCircuit).toBe(true); expect(g.eulerPath).toBe(false); });
  it('girth 3', () => expect(g.girth).toBe(3));
  it('triangles 1', () => expect(g.triangles).toBe(1));
  it('diameter 1', () => expect(g.diameter).toBe(1));
  it('wiener 3 (3 pairs at distance 1)', () => expect(g.wiener).toBe(3));
  it('MIS 1, MVC 2, clique 3', () => { expect(g.mis).toBe(1); expect(g.mvc).toBe(2); expect(g.clique).toBe(3); });
  it('matchingSize 1', () => expect(g.matchingSize).toBe(1));
  it('Zagreb M1=12, M2=12', () => { expect(g.m1).toBe(12); expect(g.m2).toBe(12); });
  it('chromGreedy 3', () => expect(g.chromGreedy).toBe(3));
  it('Hamiltonian cycle', () => expect(g.hamiltonianCycle).toBe(true));
});

describe('analyzeGraph — P4 (path on 4 vertices)', () => {
  const g = analyzeGraph(4, [[0, 1], [1, 2], [2, 3]]);
  it('n=4, m=3, density=0.5', () => { expect(g.n).toBe(4); expect(g.m).toBe(3); expect(g.density).toBe(0.5); });
  it('connected', () => expect(g.connected).toBe(true));
  it('degree sequence [1,2,2,1]', () => { expect(g.minDeg).toBe(1); expect(g.maxDeg).toBe(2); expect(g.avgDeg).toBe(1.5); });
  it('bipartite, tree', () => { expect(g.bipartite).toBe(true); expect(g.isTree).toBe(true); });
  it('not regular', () => expect(g.isRegular).toBeNull());
  it('Euler path (exactly 2 odd-deg vertices)', () => { expect(g.eulerPath).toBe(true); expect(g.eulerCircuit).toBe(false); });
  it('girth -1 (tree)', () => expect(g.girth).toBe(-1));
  it('diameter 3', () => expect(g.diameter).toBe(3));
  it('wiener 10', () => expect(g.wiener).toBe(10));
  it('MIS 2, MVC 2, clique 2', () => { expect(g.mis).toBe(2); expect(g.mvc).toBe(2); expect(g.clique).toBe(2); });
  it('matchingSize 2 (perfect matching)', () => expect(g.matchingSize).toBe(2));
  it('Zagreb M1=10, M2=8', () => { expect(g.m1).toBe(10); expect(g.m2).toBe(8); });
  it('chromGreedy 2', () => expect(g.chromGreedy).toBe(2));
  it('Hamiltonian path, no cycle', () => { expect(g.hamiltonianPath).toBe(true); expect(g.hamiltonianCycle).toBe(false); });
  it('spanningTrees 1 (path is one spanning tree)', () => expect(g.spanningTrees).toBe(1));
});

describe('analyzeGraph — C4 (4-cycle)', () => {
  const g = analyzeGraph(4, [[0, 1], [1, 2], [2, 3], [3, 0]]);
  it('n=4, m=4', () => { expect(g.n).toBe(4); expect(g.m).toBe(4); });
  it('density 2/3', () => expect(g.density).toBeCloseTo(2 / 3, 10));
  it('connected', () => expect(g.connected).toBe(true));
  it('bipartite (even cycle)', () => expect(g.bipartite).toBe(true));
  it('not a tree', () => expect(g.isTree).toBe(false));
  it('2-regular', () => expect(g.isRegular).toBe(2));
  it('Eulerian circuit', () => { expect(g.eulerCircuit).toBe(true); expect(g.eulerPath).toBe(false); });
  it('girth 4', () => expect(g.girth).toBe(4));
  it('triangles 0', () => expect(g.triangles).toBe(0));
  it('diameter 2', () => expect(g.diameter).toBe(2));
  it('wiener 8', () => expect(g.wiener).toBe(8));
  it('MIS 2, MVC 2, clique 2', () => { expect(g.mis).toBe(2); expect(g.mvc).toBe(2); expect(g.clique).toBe(2); });
  it('matchingSize 2', () => expect(g.matchingSize).toBe(2));
  it('Zagreb M1=16, M2=16', () => { expect(g.m1).toBe(16); expect(g.m2).toBe(16); });
  it('chromGreedy 2', () => expect(g.chromGreedy).toBe(2));
  it('Hamiltonian cycle', () => expect(g.hamiltonianCycle).toBe(true));
});

describe('analyzeGraph — C5 (5-cycle)', () => {
  const g = analyzeGraph(5, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]]);
  it('n=5, m=5, density=0.5', () => { expect(g.n).toBe(5); expect(g.m).toBe(5); expect(g.density).toBe(0.5); });
  it('not bipartite (odd cycle)', () => expect(g.bipartite).toBe(false));
  it('2-regular', () => expect(g.isRegular).toBe(2));
  it('Eulerian circuit', () => expect(g.eulerCircuit).toBe(true));
  it('girth 5', () => expect(g.girth).toBe(5));
  it('triangles 0', () => expect(g.triangles).toBe(0));
  it('diameter 2', () => expect(g.diameter).toBe(2));
  it('wiener 15 (5×1 + 5×2)', () => expect(g.wiener).toBe(15));
  it('MIS 2, MVC 3, clique 2', () => { expect(g.mis).toBe(2); expect(g.mvc).toBe(3); expect(g.clique).toBe(2); });
  it('matchingSize 2', () => expect(g.matchingSize).toBe(2));
  it('Zagreb M1=20, M2=20', () => { expect(g.m1).toBe(20); expect(g.m2).toBe(20); });
  it('chromGreedy 3 (odd cycle)', () => expect(g.chromGreedy).toBe(3));
  it('Hamiltonian cycle', () => expect(g.hamiltonianCycle).toBe(true));
});

describe('analyzeGraph — Star K_{1,3}', () => {
  const g = analyzeGraph(4, [[0, 1], [0, 2], [0, 3]]);
  it('n=4, m=3', () => { expect(g.n).toBe(4); expect(g.m).toBe(3); });
  it('bipartite, tree', () => { expect(g.bipartite).toBe(true); expect(g.isTree).toBe(true); });
  it('not regular (hub deg 3, leaves deg 1)', () => expect(g.isRegular).toBeNull());
  it('minDeg 1, maxDeg 3', () => { expect(g.minDeg).toBe(1); expect(g.maxDeg).toBe(3); });
  it('no Euler path or circuit (4 odd-deg vertices)', () => { expect(g.eulerPath).toBe(false); expect(g.eulerCircuit).toBe(false); });
  it('girth -1 (tree)', () => expect(g.girth).toBe(-1));
  it('diameter 2', () => expect(g.diameter).toBe(2));
  it('wiener 9 (3×1 hub-leaf + 3×2 leaf-leaf)', () => expect(g.wiener).toBe(9));
  it('MIS 3 (all leaves), MVC 1 (hub), clique 2', () => { expect(g.mis).toBe(3); expect(g.mvc).toBe(1); expect(g.clique).toBe(2); });
  it('matchingSize 1 (all edges share hub)', () => expect(g.matchingSize).toBe(1));
  it('Zagreb M1=12, M2=9', () => { expect(g.m1).toBe(12); expect(g.m2).toBe(9); });
  it('chromGreedy 2', () => expect(g.chromGreedy).toBe(2));
  it('no Hamiltonian path (star with 3+ leaves)', () => { expect(g.hamiltonianCycle).toBe(false); expect(g.hamiltonianPath).toBe(false); });
});

describe('analyzeGraph — K4 (complete on 4 vertices)', () => {
  const g = analyzeGraph(4, [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]]);
  it('n=4, m=6, density=1', () => { expect(g.n).toBe(4); expect(g.m).toBe(6); expect(g.density).toBe(1); });
  it('not bipartite', () => expect(g.bipartite).toBe(false));
  it('3-regular', () => expect(g.isRegular).toBe(3));
  it('no Euler circuit (all odd degree)', () => expect(g.eulerCircuit).toBe(false));
  it('girth 3', () => expect(g.girth).toBe(3));
  it('triangles 4', () => expect(g.triangles).toBe(4));
  it('diameter 1', () => expect(g.diameter).toBe(1));
  it('wiener 6 (all pairs at distance 1)', () => expect(g.wiener).toBe(6));
  it('MIS 1, MVC 3, clique 4', () => { expect(g.mis).toBe(1); expect(g.mvc).toBe(3); expect(g.clique).toBe(4); });
  it('matchingSize 2', () => expect(g.matchingSize).toBe(2));
  it('Zagreb M1=36, M2=54', () => { expect(g.m1).toBe(36); expect(g.m2).toBe(54); });
  it('chromGreedy 4', () => expect(g.chromGreedy).toBe(4));
  it('Hamiltonian cycle', () => expect(g.hamiltonianCycle).toBe(true));
});

describe('analyzeGraph — disconnected (two edges, 4 vertices)', () => {
  const g = analyzeGraph(4, [[0, 1], [2, 3]]);
  it('not connected, 2 components', () => { expect(g.connected).toBe(false); expect(g.components).toBe(2); });
  it('bipartite', () => expect(g.bipartite).toBe(true));
  it('not a tree (disconnected)', () => expect(g.isTree).toBe(false));
  it('no Euler path/circuit (disconnected)', () => { expect(g.eulerCircuit).toBe(false); expect(g.eulerPath).toBe(false); });
  it('diameter null (disconnected)', () => expect(g.diameter).toBeNull());
  it('wiener null (disconnected)', () => expect(g.wiener).toBeNull());
  it('MIS 2', () => expect(g.mis).toBe(2));
  it('matchingSize 2', () => expect(g.matchingSize).toBe(2));
  it('girth -1 (no cycles)', () => expect(g.girth).toBe(-1));
});

describe('analyzeGraph — Petersen graph', () => {
  const edges = [];
  for (let i = 0; i < 5; i++) edges.push([i, (i + 1) % 5]);
  for (let i = 0; i < 5; i++) edges.push([5 + i, 5 + (i + 2) % 5]);
  for (let i = 0; i < 5; i++) edges.push([i, 5 + i]);
  const g = analyzeGraph(10, edges);
  it('n=10, m=15', () => { expect(g.n).toBe(10); expect(g.m).toBe(15); });
  it('3-regular', () => expect(g.isRegular).toBe(3));
  it('connected', () => expect(g.connected).toBe(true));
  it('not bipartite', () => expect(g.bipartite).toBe(false));
  it('girth 5', () => expect(g.girth).toBe(5));
  it('diameter 2', () => expect(g.diameter).toBe(2));
  it('triangles 0', () => expect(g.triangles).toBe(0));
  it('no Eulerian circuit (all odd degree)', () => expect(g.eulerCircuit).toBe(false));
  it('clique 2 (triangle-free)', () => expect(g.clique).toBe(2));
  it('MIS 4 (independence number of Petersen)', () => expect(g.mis).toBe(4));
  it('chromGreedy ≤ 4', () => expect(g.chromGreedy).toBeLessThanOrEqual(4));
  it('no Hamiltonian cycle', () => expect(g.hamiltonianCycle).toBe(false));
});

// ── evalConjecture ────────────────────────────────────────────────────────────

describe('evalConjecture', () => {
  const stats = { n: 5, m: 4, wiener: 10, density: 0.4, connected: true, bipartite: false };

  it('empty expression → null', () => expect(evalConjecture('', stats)).toBeNull());
  it('whitespace-only → null', () => expect(evalConjecture('   ', stats)).toBeNull());
  it('true expression', () => expect(evalConjecture('n > 0', stats)).toBe(true));
  it('false expression', () => expect(evalConjecture('m === 0', stats)).toBe(false));
  it('uses all bound variables', () => expect(evalConjecture('n + m === 9', stats)).toBe(true));
  it('boolean variable (connected)', () => expect(evalConjecture('connected', stats)).toBe(true));
  it('boolean variable negated', () => expect(evalConjecture('!bipartite', stats)).toBe(true));
  it('floating-point comparison', () => expect(evalConjecture('density < 0.5', stats)).toBe(true));
  it('syntax error → "error"', () => expect(evalConjecture('n +* m', stats)).toBe('error'));
  it('runtime error (division by zero is NaN, not throw) → false', () => {
    // 1/0 = Infinity in JS, !!(Infinity) = true
    expect(evalConjecture('1 / 0 > 0', stats)).toBe(true);
  });
  it('throwing expression → "error"', () => expect(evalConjecture('(()=>{throw new Error();})()', stats)).toBe('error'));
  it('conjecture n*(n-1)/2 >= m (trivially true for simple graphs)', () => {
    expect(evalConjecture('n*(n-1)/2 >= m', stats)).toBe(true);
  });

  it('wiener vs K3 (all pairs at distance 1, wiener=3)', () => {
    const k3stats = analyzeGraph(3, [[0,1],[1,2],[0,2]]);
    expect(evalConjecture('wiener === n*(n-1)/2', k3stats)).toBe(true);
  });

  it('Euler circuit detected by expression', () => {
    const c5 = analyzeGraph(5, [[0,1],[1,2],[2,3],[3,4],[4,0]]);
    expect(evalConjecture('eulerCircuit', c5)).toBe(true);
    const p4 = analyzeGraph(4, [[0,1],[1,2],[2,3]]);
    expect(evalConjecture('eulerCircuit', p4)).toBe(false);
  });

  it('mis + mvc === n (complement law)', () => {
    const g = analyzeGraph(5, [[0,1],[1,2],[2,3],[3,4],[4,0]]);
    expect(evalConjecture('mis + mvc === n', g)).toBe(true);
  });
});

// ── sweepParams ───────────────────────────────────────────────────────────────

describe('sweepParams', () => {
  it('single int param [2..4] → 3 values', () => {
    const params = [{ id: 'n', type: 'int' }];
    const ranges = { n: { min: 2, max: 4, step: 1 } };
    const results = [...sweepParams(params, ranges)];
    expect(results).toEqual([{ n: 2 }, { n: 3 }, { n: 4 }]);
  });

  it('empty params → one empty object', () => {
    const results = [...sweepParams([], {})];
    expect(results).toEqual([{}]);
  });

  it('two int params → Cartesian product', () => {
    const params = [
      { id: 'n', type: 'int' },
      { id: 'k', type: 'int' },
    ];
    const ranges = { n: { min: 1, max: 2, step: 1 }, k: { min: 3, max: 4, step: 1 } };
    const results = [...sweepParams(params, ranges)];
    expect(results).toEqual([
      { n: 1, k: 3 }, { n: 1, k: 4 },
      { n: 2, k: 3 }, { n: 2, k: 4 },
    ]);
  });

  it('float param with step 0.5', () => {
    const params = [{ id: 'p', type: 'float' }];
    const ranges = { p: { min: 0, max: 1, step: 0.5 } };
    const results = [...sweepParams(params, ranges)];
    expect(results.map(r => r.p)).toEqual([0, 0.5, 1]);
  });

  it('single value range (min===max) → exactly one result', () => {
    const params = [{ id: 'n', type: 'int' }];
    const ranges = { n: { min: 5, max: 5, step: 1 } };
    const results = [...sweepParams(params, ranges)];
    expect(results).toEqual([{ n: 5 }]);
  });

  it('step=2 covers every other integer', () => {
    const params = [{ id: 'n', type: 'int' }];
    const ranges = { n: { min: 2, max: 8, step: 2 } };
    const results = [...sweepParams(params, ranges)];
    expect(results.map(r => r.n)).toEqual([2, 4, 6, 8]);
  });
});

// ── sweepCount ────────────────────────────────────────────────────────────────

describe('sweepCount', () => {
  it('single param [2..4] step 1 → 3', () => {
    expect(sweepCount([{ id: 'n' }], { n: { min: 2, max: 4, step: 1 } })).toBe(3);
  });

  it('no params → 1', () => {
    expect(sweepCount([], {})).toBe(1);
  });

  it('two params → product of sizes', () => {
    const params = [{ id: 'n' }, { id: 'k' }];
    const ranges = { n: { min: 1, max: 3, step: 1 }, k: { min: 0, max: 4, step: 2 } };
    expect(sweepCount(params, ranges)).toBe(3 * 3);  // n in {1,2,3}, k in {0,2,4}
  });

  it('single-value range → 1', () => {
    expect(sweepCount([{ id: 'n' }], { n: { min: 7, max: 7, step: 1 } })).toBe(1);
  });

  it('step=2 counts correctly', () => {
    expect(sweepCount([{ id: 'n' }], { n: { min: 2, max: 8, step: 2 } })).toBe(4);
  });

  it('matches actual sweep length for multi-param', () => {
    const params = [{ id: 'n', type: 'int' }, { id: 'k', type: 'int' }];
    const ranges = { n: { min: 3, max: 7, step: 1 }, k: { min: 1, max: 3, step: 1 } };
    const actual = [...sweepParams(params, ranges)].length;
    expect(sweepCount(params, ranges)).toBe(actual);
  });
});
