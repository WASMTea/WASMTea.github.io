import { describe, it, expect } from 'vitest';
import { computeExtendedMetrics, jacobiEig, hamCycle, hamPath, augmentMatch } from '../js/reports.js';

function mkAdj(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
  return adj;
}

// ── jacobiEig ────────────────────────────────────────────────────────────────

describe('jacobiEig', () => {
  it('2×2 identity', () => {
    const eigs = jacobiEig([[1, 0], [0, 1]], 2).sort((a, b) => a - b);
    expect(eigs[0]).toBeCloseTo(1, 8);
    expect(eigs[1]).toBeCloseTo(1, 8);
  });

  it('2×2 symmetric — K2 adjacency', () => {
    const eigs = jacobiEig([[0, 1], [1, 0]], 2).sort((a, b) => b - a);
    expect(eigs[0]).toBeCloseTo(1, 8);
    expect(eigs[1]).toBeCloseTo(-1, 8);
  });

  it('handles zero off-diagonal (diagonal matrix)', () => {
    const eigs = jacobiEig([[3, 0], [0, 7]], 2).sort((a, b) => a - b);
    expect(eigs[0]).toBeCloseTo(3, 8);
    expect(eigs[1]).toBeCloseTo(7, 8);
  });

  it('equal diagonal entries (theta=0 edge case)', () => {
    // [[0,1],[1,0]] — both diagonal entries equal, theta=0
    const eigs = jacobiEig([[0, 1], [1, 0]], 2).sort((a, b) => a - b);
    expect(eigs[0]).toBeCloseTo(-1, 8);
    expect(eigs[1]).toBeCloseTo(1, 8);
  });

  it('K3 adjacency eigenvalues', () => {
    const A = [[0, 1, 1], [1, 0, 1], [1, 1, 0]];
    const eigs = jacobiEig(A, 3).sort((a, b) => b - a);
    expect(eigs[0]).toBeCloseTo(2, 6);
    expect(eigs[1]).toBeCloseTo(-1, 6);
    expect(eigs[2]).toBeCloseTo(-1, 6);
  });
});

// ── hamCycle / hamPath ────────────────────────────────────────────────────────

describe('hamCycle', () => {
  it('K3 has a Hamiltonian cycle', () => {
    const amat = [[0,1,1],[1,0,1],[1,1,0]].map(r => new Uint8Array(r));
    expect(hamCycle(0, 3, amat)).toBe(true);
  });

  it('P3 has no Hamiltonian cycle', () => {
    const amat = [[0,1,0],[1,0,1],[0,1,0]].map(r => new Uint8Array(r));
    expect(hamCycle(0, 3, amat)).toBe(false);
  });

  it('C4 has a Hamiltonian cycle', () => {
    const amat = [[0,1,0,1],[1,0,1,0],[0,1,0,1],[1,0,1,0]].map(r => new Uint8Array(r));
    expect(hamCycle(0, 4, amat)).toBe(true);
  });

  it('K_{1,3} star has no Hamiltonian cycle', () => {
    const amat = [[0,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,0,0]].map(r => new Uint8Array(r));
    expect(hamCycle(0, 4, amat)).toBe(false);
  });
});

describe('hamPath', () => {
  it('P3 has a Hamiltonian path', () => {
    const amat = [[0,1,0],[1,0,1],[0,1,0]].map(r => new Uint8Array(r));
    expect(hamPath(3, amat)).toBe(true);
  });

  it('K_{1,3} has no Hamiltonian path', () => {
    const amat = [[0,1,1,1],[1,0,0,0],[1,0,0,0],[1,0,0,0]].map(r => new Uint8Array(r));
    expect(hamPath(4, amat)).toBe(false);
  });

  it('K_{2,3} has a Hamiltonian path', () => {
    // adj: 0-2,0-3,0-4, 1-2,1-3,1-4
    const amat = [
      [0,0,1,1,1],
      [0,0,1,1,1],
      [1,1,0,0,0],
      [1,1,0,0,0],
      [1,1,0,0,0],
    ].map(r => new Uint8Array(r));
    expect(hamPath(5, amat)).toBe(true);
  });
});

// ── augmentMatch ─────────────────────────────────────────────────────────────

describe('augmentMatch', () => {
  it('augments a free vertex', () => {
    const adj = [[1], [0]];
    const match = new Int32Array([-1, -1]);
    const vis = new Uint8Array([1, 0]);
    expect(augmentMatch(0, adj, match, vis)).toBe(true);
    expect(match[0]).toBe(1);
    expect(match[1]).toBe(0);
  });

  it('finds augmenting path via alternating chain', () => {
    // P3: 0-1-2, already matched 0-1; augment from 2
    const adj = [[1], [0, 2], [1]];
    const match = new Int32Array([1, 0, -1]);
    const vis = new Uint8Array([0, 0, 1]);
    // from vertex 2: can reach 1, which is matched to 0; 0 has no other options
    expect(augmentMatch(2, adj, match, vis)).toBe(false);
  });
});

// ── computeExtendedMetrics ────────────────────────────────────────────────────

const connected = is_connected => ({ edge_count: 0, is_connected }); // placeholder; overridden per graph

describe('K2 (single edge)', () => {
  const n = 2, adj = mkAdj(2, [[0,1]]);
  const base = { edge_count: 1, is_connected: true };
  const r = computeExtendedMetrics(n, adj, base);

  it('basic', () => {
    expect(r.isTree).toBe(true);
    expect(r.isRegular).toBe(true);
    expect(r.regularDeg).toBe(1);
    expect(r.triangles).toBe(0);
    expect(r.quadrangles).toBe(0);
    expect(r.girth).toBe(-1);
  });

  it('degree indices', () => {
    expect(r.m1).toBe(2);
    expect(r.m2).toBe(1);
    expect(r.forgotten).toBe(2);
    expect(r.randic).toBeCloseTo(1, 4);
    expect(r.harmonic).toBeCloseTo(1, 4);
    expect(r.ga).toBeCloseTo(1, 4);
    expect(r.albertson).toBe(0);
    expect(r.azi).toBe(0);
  });

  it('distance indices', () => {
    expect(r.wiener).toBe(1);
    expect(r.harary).toBeCloseTo(1, 4);
    expect(r.hyperWiener).toBe(2);
    expect(r.avgDist).toBeCloseTo(1, 4);
    expect(r.degDist).toBe(2);
    expect(r.gutman).toBe(1);
    expect(r.szeged).toBe(1);
    expect(r.piIndex).toBe(2);
    expect(r.mostar).toBe(0);
  });

  it('eccentricity', () => {
    expect(r.radius).toBe(1);
    expect(r.totalEcc).toBe(2);
    expect(r.avgEcc).toBeCloseTo(1, 4);
    expect(r.eccConn).toBe(2);
    expect(r.connEcc).toBeCloseTo(2, 4);
  });

  it('spectral', () => {
    expect(r.adjSpectrum).toHaveLength(2);
    expect(r.adjSpectrum[0]).toBeCloseTo(1, 4);
    expect(r.adjSpectrum[1]).toBeCloseTo(-1, 4);
    expect(r.energy).toBeCloseTo(2, 4);
    expect(r.spectralRadius).toBeCloseTo(1, 4);
    expect(r.fiedler).toBeCloseTo(2, 4);
    expect(r.spanningTrees).toBe(1);
    expect(r.slSpectrum[0]).toBeCloseTo(2, 4);
    expect(r.slSpectrum[1]).toBeCloseTo(0, 4);
    expect(r.slEnergy).toBeCloseTo(2, 4);
  });

  it('matching & chromatic', () => {
    expect(r.matchingSize).toBe(1);
    expect(r.chromaticIndex).toBe('1');
  });

  it('Hamiltonian n<3 → null', () => {
    expect(r.hamiltonianCycle).toBeNull();
    expect(r.hamiltonianPath).toBeNull();
  });
});

describe('P3 (path on 3 vertices)', () => {
  // 0 — 1 — 2
  const n = 3, adj = mkAdj(3, [[0,1],[1,2]]);
  const base = { edge_count: 2, is_connected: true };
  const r = computeExtendedMetrics(n, adj, base);

  it('basic', () => {
    expect(r.isTree).toBe(true);
    expect(r.isRegular).toBe(false);
    expect(r.triangles).toBe(0);
    expect(r.girth).toBe(-1);
    expect(r.pruferSeq).toEqual([1]);
  });

  it('degree indices', () => {
    expect(r.m1).toBe(6);
    expect(r.m2).toBe(4);
    expect(r.forgotten).toBe(10);
    expect(r.randic).toBeCloseTo(Math.sqrt(2), 4);
    expect(r.harmonic).toBeCloseTo(4/3, 4);
    expect(r.albertson).toBe(2);
    expect(r.azi).toBeCloseTo(16, 4);
  });

  it('distance indices', () => {
    expect(r.wiener).toBe(4);
    expect(r.harary).toBeCloseTo(2.5, 4);
    expect(r.hyperWiener).toBe(10);
    expect(r.avgDist).toBeCloseTo(4/3, 4);
    expect(r.degDist).toBe(10);
    expect(r.gutman).toBe(6);
    expect(r.szeged).toBe(4);
    expect(r.piIndex).toBe(6);
    expect(r.mostar).toBe(2);
  });

  it('eccentricity', () => {
    expect(r.radius).toBe(1);
    expect(r.totalEcc).toBe(5);
    expect(r.eccConn).toBe(6);
  });

  it('spectral', () => {
    expect(r.energy).toBeCloseTo(2 * Math.sqrt(2), 4);
    expect(r.spectralRadius).toBeCloseTo(Math.sqrt(2), 4);
    expect(r.fiedler).toBeCloseTo(1, 4);
    expect(r.spanningTrees).toBe(1);
    expect(r.slEnergy).toBeCloseTo(4, 4);
  });

  it('Hamiltonian', () => {
    expect(r.hamiltonianCycle).toBe(false);
    expect(r.hamiltonianPath).toBe(true);
  });

  it('matching', () => {
    expect(r.matchingSize).toBe(1);
    expect(r.chromaticIndex).toBe('2');  // bipartite, Δ=2
  });
});

describe('K3 (triangle)', () => {
  const n = 3, adj = mkAdj(3, [[0,1],[0,2],[1,2]]);
  const base = { edge_count: 3, is_connected: true };
  const r = computeExtendedMetrics(n, adj, base);

  it('basic', () => {
    expect(r.isTree).toBe(false);
    expect(r.isRegular).toBe(true);
    expect(r.regularDeg).toBe(2);
    expect(r.triangles).toBe(1);
    expect(r.quadrangles).toBe(0);
    expect(r.girth).toBe(3);
  });

  it('degree indices', () => {
    expect(r.m1).toBe(12);
    expect(r.m2).toBe(12);
    expect(r.forgotten).toBe(24);
    expect(r.randic).toBeCloseTo(1.5, 4);
    expect(r.harmonic).toBeCloseTo(1.5, 4);
    expect(r.ga).toBeCloseTo(3, 4);
    expect(r.albertson).toBe(0);
    expect(r.azi).toBeCloseTo(24, 4);
  });

  it('distance indices', () => {
    expect(r.wiener).toBe(3);
    expect(r.harary).toBeCloseTo(3, 4);
    expect(r.hyperWiener).toBe(6);
    expect(r.avgDist).toBeCloseTo(1, 4);
    expect(r.szeged).toBe(3);
    expect(r.piIndex).toBe(6);
    expect(r.mostar).toBe(0);
  });

  it('eccentricity', () => {
    expect(r.radius).toBe(1);
    expect(r.totalEcc).toBe(3);
    expect(r.eccConn).toBe(6);
    expect(r.connEcc).toBeCloseTo(6, 4);
  });

  it('spectral', () => {
    expect(r.adjSpectrum[0]).toBeCloseTo(2, 4);
    expect(r.adjSpectrum[1]).toBeCloseTo(-1, 4);
    expect(r.energy).toBeCloseTo(4, 4);
    expect(r.spectralRadius).toBeCloseTo(2, 4);
    expect(r.fiedler).toBeCloseTo(3, 4);
    expect(r.spanningTrees).toBe(3);
    expect(r.slSpectrum[0]).toBeCloseTo(4, 4);
    expect(r.slSpectrum[1]).toBeCloseTo(1, 4);
    expect(r.slEnergy).toBeCloseTo(6, 4);
  });

  it('Hamiltonian', () => {
    expect(r.hamiltonianCycle).toBe(true);
    expect(r.hamiltonianPath).toBe(true);
  });

  it('matching', () => {
    expect(r.matchingSize).toBe(1);
    expect(r.chromaticIndex).toBe('2–3'); // non-bipartite, Δ=2
  });
});

describe('C4 (4-cycle)', () => {
  // 0—1—2—3—0
  const n = 4, adj = mkAdj(4, [[0,1],[1,2],[2,3],[3,0]]);
  const base = { edge_count: 4, is_connected: true };
  const r = computeExtendedMetrics(n, adj, base);

  it('basic', () => {
    expect(r.isTree).toBe(false);
    expect(r.isRegular).toBe(true);
    expect(r.regularDeg).toBe(2);
    expect(r.triangles).toBe(0);
    expect(r.quadrangles).toBe(2);  // 2 per algorithm (1 actual C4 counted twice)
    expect(r.girth).toBe(4);
  });

  it('degree indices', () => {
    expect(r.m1).toBe(16);
    expect(r.m2).toBe(16);
    expect(r.randic).toBeCloseTo(2, 4);
    expect(r.harmonic).toBeCloseTo(2, 4);
    expect(r.azi).toBeCloseTo(32, 4);
    expect(r.albertson).toBe(0);
  });

  it('distance indices', () => {
    expect(r.wiener).toBe(8);
    expect(r.harary).toBeCloseTo(5, 4);
    expect(r.hyperWiener).toBe(20);
    expect(r.avgDist).toBeCloseTo(4/3, 4);
    expect(r.szeged).toBe(16);
    expect(r.piIndex).toBe(16);
    expect(r.mostar).toBe(0);
  });

  it('eccentricity', () => {
    expect(r.radius).toBe(2);
    expect(r.totalEcc).toBe(8);
    expect(r.eccConn).toBe(16);
    expect(r.connEcc).toBeCloseTo(4, 4);
  });

  it('spectral', () => {
    expect(r.adjSpectrum[0]).toBeCloseTo(2, 4);
    expect(r.adjSpectrum[3]).toBeCloseTo(-2, 4);
    expect(r.energy).toBeCloseTo(4, 4);
    expect(r.fiedler).toBeCloseTo(2, 4);
    expect(r.spanningTrees).toBe(4);
    expect(r.slSpectrum[0]).toBeCloseTo(4, 4);
    expect(r.slSpectrum[3]).toBeCloseTo(0, 4);
    expect(r.slEnergy).toBeCloseTo(8, 4);
  });

  it('Hamiltonian', () => {
    expect(r.hamiltonianCycle).toBe(true);
    expect(r.hamiltonianPath).toBe(true);
  });

  it('matching', () => {
    expect(r.matchingSize).toBe(2);
    expect(r.chromaticIndex).toBe('2');  // bipartite, Δ=2
  });
});

describe('K_{1,3} star', () => {
  // centre=0, leaves=1,2,3
  const n = 4, adj = mkAdj(4, [[0,1],[0,2],[0,3]]);
  const base = { edge_count: 3, is_connected: true };
  const r = computeExtendedMetrics(n, adj, base);

  it('basic', () => {
    expect(r.isTree).toBe(true);
    expect(r.isRegular).toBe(false);
    expect(r.triangles).toBe(0);
    expect(r.quadrangles).toBe(0);
    expect(r.girth).toBe(-1);
    expect(r.pruferSeq).toEqual([0, 0]);
  });

  it('degree indices', () => {
    expect(r.m1).toBe(12);
    expect(r.m2).toBe(9);
    expect(r.forgotten).toBe(30);
    expect(r.randic).toBeCloseTo(Math.sqrt(3), 4);
    expect(r.harmonic).toBeCloseTo(1.5, 4);
    expect(r.albertson).toBe(6);
    expect(r.azi).toBeCloseTo(10.125, 4);
  });

  it('distance indices', () => {
    expect(r.wiener).toBe(9);
    expect(r.harary).toBeCloseTo(4.5, 4);
    expect(r.hyperWiener).toBe(24);
    expect(r.avgDist).toBeCloseTo(1.5, 4);
    expect(r.szeged).toBe(9);
    expect(r.piIndex).toBe(12);
    expect(r.mostar).toBe(6);
  });

  it('eccentricity', () => {
    expect(r.radius).toBe(1);
    expect(r.totalEcc).toBe(7);
    expect(r.eccConn).toBe(9);
    expect(r.connEcc).toBeCloseTo(4.5, 4);
  });

  it('spectral', () => {
    expect(r.adjSpectrum[0]).toBeCloseTo(Math.sqrt(3), 4);
    expect(r.adjSpectrum[3]).toBeCloseTo(-Math.sqrt(3), 4);
    expect(r.energy).toBeCloseTo(2 * Math.sqrt(3), 4);
    expect(r.fiedler).toBeCloseTo(1, 4);
    expect(r.spanningTrees).toBe(1);
    expect(r.lapSpectrum[0]).toBeCloseTo(0, 4);
    expect(r.lapSpectrum[1]).toBeCloseTo(1, 4);
    expect(r.lapSpectrum[3]).toBeCloseTo(4, 4);
    expect(r.slSpectrum[0]).toBeCloseTo(4, 4);
    expect(r.slSpectrum[3]).toBeCloseTo(0, 4);
    expect(r.slEnergy).toBeCloseTo(6, 4);
  });

  it('Hamiltonian', () => {
    expect(r.hamiltonianCycle).toBe(false);
    expect(r.hamiltonianPath).toBe(false);
  });

  it('matching', () => {
    expect(r.matchingSize).toBe(1);
    expect(r.chromaticIndex).toBe('3');  // bipartite, Δ=3
  });
});

describe('K_{2,3} complete bipartite', () => {
  // left: 0,1  right: 2,3,4
  const n = 5, adj = mkAdj(5, [[0,2],[0,3],[0,4],[1,2],[1,3],[1,4]]);
  const base = { edge_count: 6, is_connected: true };
  const r = computeExtendedMetrics(n, adj, base);

  it('basic', () => {
    expect(r.isTree).toBe(false);
    expect(r.triangles).toBe(0);
    expect(r.girth).toBe(4);
    expect(r.quadrangles).toBe(6);  // 3 actual C4s × 2
  });

  it('degree indices', () => {
    expect(r.m1).toBe(30);
    expect(r.m2).toBe(36);
    expect(r.forgotten).toBe(78);
    expect(r.randic).toBeCloseTo(Math.sqrt(6), 4);
    expect(r.harmonic).toBeCloseTo(2.4, 4);
    expect(r.albertson).toBe(6);
    expect(r.azi).toBeCloseTo(48, 4);
  });

  it('distance indices', () => {
    expect(r.wiener).toBe(14);
    expect(r.harary).toBeCloseTo(8, 4);
    expect(r.avgDist).toBeCloseTo(1.4, 4);
    expect(r.szeged).toBe(36);
    expect(r.piIndex).toBe(30);
    expect(r.mostar).toBe(6);
  });

  it('eccentricity', () => {
    expect(r.radius).toBe(2);
    expect(r.totalEcc).toBe(10);
    expect(r.eccConn).toBe(24);
    expect(r.connEcc).toBeCloseTo(6, 4);
  });

  it('spectral', () => {
    expect(r.adjSpectrum[0]).toBeCloseTo(Math.sqrt(6), 4);
    expect(r.adjSpectrum[4]).toBeCloseTo(-Math.sqrt(6), 4);
    expect(r.energy).toBeCloseTo(2 * Math.sqrt(6), 4);
    expect(r.fiedler).toBeCloseTo(2, 4);
    expect(r.spanningTrees).toBe(12);
    expect(r.lapSpectrum[0]).toBeCloseTo(0, 4);
    expect(r.lapSpectrum[1]).toBeCloseTo(2, 4);
    expect(r.lapSpectrum[2]).toBeCloseTo(2, 4);
    expect(r.lapSpectrum[3]).toBeCloseTo(3, 4);
    expect(r.lapSpectrum[4]).toBeCloseTo(5, 4);
    expect(r.slSpectrum[0]).toBeCloseTo(5, 4);
    expect(r.slSpectrum[4]).toBeCloseTo(0, 4);
    expect(r.slEnergy).toBeCloseTo(12, 4);
  });

  it('Hamiltonian', () => {
    expect(r.hamiltonianCycle).toBe(false);  // K_{2,3}: |left|≠|right|
    expect(r.hamiltonianPath).toBe(true);
  });

  it('matching and chromatic index', () => {
    expect(r.matchingSize).toBe(2);
    expect(r.chromaticIndex).toBe('3');  // bipartite K_{2,3}: Δ=3
  });
});

describe('disconnected graph (two K2 components)', () => {
  // 0—1  and  2—3
  const n = 4, adj = mkAdj(4, [[0,1],[2,3]]);
  const base = { edge_count: 2, is_connected: false };
  const r = computeExtendedMetrics(n, adj, base);

  it('distance-based indices are null', () => {
    expect(r.wiener).toBeNull();
    expect(r.harary).toBeNull();
    expect(r.radius).toBeNull();
    expect(r.totalEcc).toBeNull();
    expect(r.distComputed).toBe(false);
  });

  it('non-distance indices still computed', () => {
    expect(r.m1).toBe(4);
    expect(r.m2).toBe(2);
    expect(r.triangles).toBe(0);
    expect(r.matchingSize).toBe(2);
  });

  it('isTree is false (disconnected)', () => {
    expect(r.isTree).toBe(false);
  });
});

describe('empty graph (n=0)', () => {
  const r = computeExtendedMetrics(0, [], { edge_count: 0, is_connected: false });

  it('returns safe defaults', () => {
    expect(r.m1).toBe(0);
    expect(r.m2).toBe(0);
    expect(r.triangles).toBe(0);
    expect(r.adjSpectrum).toBeNull();
    expect(r.wiener).toBeNull();
  });
});

describe('single vertex (n=1)', () => {
  const r = computeExtendedMetrics(1, [[]], { edge_count: 0, is_connected: true });

  it('returns safe defaults', () => {
    expect(r.isRegular).toBe(true);
    expect(r.regularDeg).toBe(0);
    expect(r.triangles).toBe(0);
    expect(r.matchingSize).toBe(0);
  });
});
