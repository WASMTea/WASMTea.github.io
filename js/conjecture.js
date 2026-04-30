import { computeExtendedMetrics } from './reports.js';

export function analyzeGraph(n, edges) {
  const adj = Array.from({length: n}, () => []);
  edges.forEach(([u, v]) => {
    if (u !== v && u >= 0 && v >= 0 && u < n && v < n) {
      adj[u].push(v); adj[v].push(u);
    }
  });
  const deg = adj.map(a => a.length);
  const m   = edges.length;

  function bfs(s) {
    const d = new Int32Array(n).fill(-1); d[s] = 0;
    const q = [s];
    for (let h = 0; h < q.length; h++) {
      const v = q[h];
      for (const u of adj[v]) if (d[u] === -1) { d[u] = d[v]+1; q.push(u); }
    }
    return d;
  }

  // Connectivity
  const comp = new Int32Array(n).fill(-1); let numComp = 0;
  for (let s = 0; s < n; s++) {
    if (comp[s] !== -1) continue;
    bfs(s).forEach((d, i) => { if (d >= 0) comp[i] = numComp; }); numComp++;
  }
  const connected = numComp === 1;

  // Bipartite
  const colorB = new Int8Array(n).fill(-1); let bipartite = true;
  bip: for (let s = 0; s < n; s++) {
    if (colorB[s] !== -1) continue;
    colorB[s] = 0; const q = [s];
    for (let h = 0; h < q.length; h++) {
      const v = q[h];
      for (const u of adj[v]) {
        if (colorB[u] === -1) { colorB[u] = 1-colorB[v]; q.push(u); }
        else if (colorB[u] === colorB[v]) { bipartite = false; break bip; }
      }
    }
  }

  // Diameter (capped at n≤300)
  let diameter = connected ? -1 : null;
  if (connected && n > 0 && n <= 300) {
    for (let s = 0; s < n; s++) {
      const d = Math.max(...bfs(s)); if (d > diameter) diameter = d;
    }
  }

  // Greedy chromatic number
  const col = new Int32Array(n);
  for (let v = 0; v < n; v++) {
    const used = new Set(adj[v].map(u => col[u]).filter(c => c > 0));
    let c = 1; while (used.has(c)) c++; col[v] = c;
  }

  // NP-hard exact (n ≤ 25)
  const exact = n <= 25; let mis = null, mvc = null, clique = null;
  if (exact && n > 0) {
    const amat = Array.from({length: n}, (_, i) => {
      const row = new Uint8Array(n); adj[i].forEach(j => { row[j] = 1; }); return row;
    });
    function computeMIS(cands, sz) {
      if (!cands.length) return sz;
      const v = cands[0], rest = cands.slice(1);
      return Math.max(computeMIS(rest.filter(u => !amat[v][u]), sz+1), computeMIS(rest, sz));
    }
    function computeClique(cands, sz) {
      if (!cands.length) return sz;
      let best = sz;
      for (let i = 0; i < cands.length; i++) {
        if (sz + cands.length - i <= best) break;
        const v = cands[i];
        best = Math.max(best, computeClique(cands.slice(i+1).filter(u => amat[v][u]), sz+1));
      }
      return best;
    }
    const all = [...Array(n).keys()];
    mis = computeMIS(all, 0); mvc = n - mis; clique = computeClique(all, 0);
  }

  const oddDeg = deg.filter(d => d % 2 !== 0).length;

  const base = { edge_count: m, is_connected: connected };
  const ext  = computeExtendedMetrics(n, adj, base);

  const isRegular = n > 0 && deg.every(d => d === deg[0]);

  return {
    n, m,
    density:      n > 1 ? (2*m)/(n*(n-1)) : 0,
    connected,    components: numComp,
    minDeg:       n > 0 ? Math.min(...deg) : 0,
    maxDeg:       n > 0 ? Math.max(...deg) : 0,
    avgDeg:       n > 0 ? deg.reduce((a,b)=>a+b,0)/n : 0,
    bipartite,
    isTree:       ext.isTree,
    isRegular:    isRegular ? deg[0] : null,
    eulerCircuit: connected && oddDeg === 0 && m > 0,
    eulerPath:    connected && oddDeg === 2,
    girth:        ext.girth,
    triangles:    ext.triangles,
    quadrangles:  ext.quadrangles,
    matchingSize: ext.matchingSize,
    spanningTrees:ext.spanningTrees ?? null,
    diameter,
    radius:       ext.radius ?? null,
    totalEcc:     ext.totalEcc ?? null,
    avgEcc:       ext.avgEcc   ?? null,
    eccConn:      ext.eccConn  ?? null,
    connEcc:      ext.connEcc  ?? null,
    m1: ext.m1, m2: ext.m2, forgotten: ext.forgotten,
    randic: ext.randic, harmonic: ext.harmonic, ga: ext.ga,
    sumConn: ext.sumConn, azi: ext.azi, albertson: ext.albertson,
    wiener:      ext.wiener      ?? null,
    hyperWiener: ext.hyperWiener ?? null,
    harary:      ext.harary      ?? null,
    avgDist:     ext.avgDist     ?? null,
    degDist:     ext.degDist     ?? null,
    gutman:      ext.gutman      ?? null,
    mostar:      ext.mostar      ?? null,
    szeged:      ext.szeged      ?? null,
    piIndex:     ext.piIndex     ?? null,
    spectralRadius: ext.spectralRadius ?? null,
    energy:         ext.energy         ?? null,
    estrada:        ext.estrada        ?? null,
    fiedler:        ext.fiedler        ?? null,
    lel:            ext.lel            ?? null,
    slEnergy:       ext.slEnergy       ?? null,
    mis, mvc, clique,
    chromGreedy:      n > 0 ? Math.max(...col) : 0,
    hamiltonianCycle: ext.hamiltonianCycle ?? null,
    hamiltonianPath:  ext.hamiltonianPath  ?? null,
  };
}

export function evalConjecture(expr, stats) {
  if (!expr.trim()) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(...Object.keys(stats), `return !!(${expr});`);
    const result = fn(...Object.values(stats));
    return result;
  } catch { return 'error'; }
}

export function* sweepParams(params, ranges) {
  function* cart(idx, cur) {
    if (idx === params.length) { yield {...cur}; return; }
    const p = params[idx];
    const r = ranges[p.id];
    const step = r.step > 0 ? r.step : 1;
    for (let v = r.min; v <= r.max + 1e-9; v += step) {
      cur[p.id] = p.type === 'float' ? +v.toFixed(6) : Math.round(v);
      yield* cart(idx + 1, cur);
    }
  }
  yield* cart(0, {});
}

export function sweepCount(params, ranges) {
  let count = 1;
  for (const p of params) {
    const r = ranges[p.id];
    const step = r.step > 0 ? r.step : 1;
    count *= Math.max(1, Math.floor((r.max - r.min) / step + 1 + 1e-9));
  }
  return count;
}
