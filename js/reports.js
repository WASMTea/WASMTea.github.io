// ── Graph analysis helpers & computeExtendedMetrics ──────────────────────────
// Shared between graph.html, large-graph.html, and the test suite.

export function jacobiEig(M, n) {
  const A = M.map(row => Float64Array.from(row));
  for (let iter = 0; iter < 100 * n * n; iter++) {
    let p = 0, q = 1, maxVal = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(A[i][j]) > maxVal) { maxVal = Math.abs(A[i][j]); p = i; q = j; }
    if (maxVal < 1e-10) break;
    const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
    const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    const c = 1 / Math.sqrt(1 + t * t), s = t * c;
    const Apq = A[p][q];
    A[p][p] -= t * Apq; A[q][q] += t * Apq; A[p][q] = A[q][p] = 0;
    for (let r = 0; r < n; r++) {
      if (r === p || r === q) continue;
      const Arp = A[r][p], Arq = A[r][q];
      A[r][p] = A[p][r] = c * Arp - s * Arq;
      A[r][q] = A[q][r] = s * Arp + c * Arq;
    }
  }
  return Array.from({length: n}, (_, i) => A[i][i]);
}

export function hamCycle(start, n, amat) {
  const vis = new Uint8Array(n); vis[start] = 1;
  function bt(v, d) {
    if (d === n) return amat[v][start] === 1;
    for (let u = 0; u < n; u++)
      if (!vis[u] && amat[v][u]) { vis[u] = 1; if (bt(u, d + 1)) return true; vis[u] = 0; }
    return false;
  }
  return bt(start, 1);
}

export function hamPath(n, amat) {
  const vis = new Uint8Array(n);
  function bt(v, d) {
    if (d === n) return true;
    for (let u = 0; u < n; u++)
      if (!vis[u] && amat[v][u]) { vis[u] = 1; if (bt(u, d + 1)) return true; vis[u] = 0; }
    return false;
  }
  for (let s = 0; s < n; s++) { vis.fill(0); vis[s] = 1; if (bt(s, 1)) return true; }
  return false;
}

export function augmentMatch(v, adj, match, vis) {
  for (const u of adj[v]) {
    if (vis[u]) continue; vis[u] = 1;
    if (match[u] === -1 || augmentMatch(match[u], adj, match, vis)) {
      match[v] = u; match[u] = v; return true;
    }
  }
  return false;
}

/**
 * Compute extended graph metrics from an adjacency list.
 * @param {number} n - Number of vertices
 * @param {number[][]} adj - Adjacency list (0-indexed, undirected)
 * @param {{ edge_count: number, is_connected: boolean }} base
 */
export function computeExtendedMetrics(n, adj, base) {
  const degrees = adj.map(a => a.length);
  const m = base.edge_count;
  const isConnected = base.is_connected;
  const maxDeg = n > 0 ? Math.max(...degrees) : 0;

  const amat = Array.from({length: n}, (_, i) => {
    const row = new Uint8Array(n);
    adj[i].forEach(j => { row[j] = 1; });
    return row;
  });

  const isTree    = isConnected && m === n - 1;
  const isRegular = n > 0 && degrees.every(d => d === degrees[0]);

  // Bipartite check (for chromatic index via Vizing / König)
  const colorB = new Int8Array(n).fill(-1);
  let isBip = true;
  bip: for (let s = 0; s < n; s++) {
    if (colorB[s] !== -1) continue;
    colorB[s] = 0;
    const bq = [s];
    for (let h = 0; h < bq.length; h++) {
      const v = bq[h];
      for (const u of adj[v]) {
        if (colorB[u] === -1) { colorB[u] = 1 - colorB[v]; bq.push(u); }
        else if (colorB[u] === colorB[v]) { isBip = false; break bip; }
      }
    }
  }
  // Bipartite: chromatic index = Δ (König); general: Δ or Δ+1 (Vizing)
  const chromaticIndex = isBip ? String(maxDeg) : `${maxDeg}–${maxDeg + 1}`;

  // ── Degree-based indices ──────────────────────────────────────────────────
  let m1 = 0, m2 = 0, randic = 0, harmonic = 0, albertson = 0;
  let forgotten = 0, ga = 0, sumConn = 0, azi = 0;
  for (let i = 0; i < n; i++) {
    m1       += degrees[i] ** 2;
    forgotten += degrees[i] ** 3;
    for (const j of adj[i]) if (j > i) {
      const di = degrees[i], dj = degrees[j], s2 = di + dj;
      m2        += di * dj;
      randic    += di && dj ? 1 / Math.sqrt(di * dj) : 0;
      harmonic  += 2 / (s2 || 1);
      albertson += Math.abs(di - dj);
      ga        += s2 > 0 ? 2 * Math.sqrt(di * dj) / s2 : 0;
      sumConn   += s2 > 0 ? 1 / Math.sqrt(s2) : 0;
      if (s2 > 2) azi += ((di * dj) / (s2 - 2)) ** 3;
    }
  }

  // ── Substructure counts ───────────────────────────────────────────────────
  let triangles = 0;
  for (let i = 0; i < n; i++)
    for (const j of adj[i]) if (j > i)
      for (const k of adj[j]) if (k > j && amat[i][k]) triangles++;

  // Quadrangles (C4), n ≤ 100
  // Counts pairs of common-neighbor selections: each C4 is counted twice
  // (once per pair of opposite vertices).
  let quadrangles = null;
  if (n <= 100) {
    const p2 = Array.from({length: n}, () => new Int32Array(n));
    for (let w = 0; w < n; w++)
      for (let ai = 0; ai < adj[w].length; ai++)
        for (let bi = ai + 1; bi < adj[w].length; bi++) {
          const u = adj[w][ai], v = adj[w][bi];
          p2[Math.min(u, v)][Math.max(u, v)]++;
        }
    quadrangles = 0;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const c = p2[i][j]; if (c >= 2) quadrangles += c * (c - 1) / 2;
      }
  }

  // Girth (length of shortest cycle), n ≤ 200; -1 if acyclic
  let girth = null;
  if (n <= 200) {
    let g = Infinity;
    for (let s = 0; s < n && g > 3; s++) {
      const d = new Int32Array(n).fill(-1), par = new Int32Array(n).fill(-1);
      d[s] = 0;
      const q = [s];
      for (let h = 0; h < q.length; h++) {
        const v = q[h];
        for (const u of adj[v]) {
          if (d[u] === -1) { d[u] = d[v] + 1; par[u] = v; q.push(u); }
          else if (par[v] !== u) { const c = d[v] + d[u] + 1; if (c < g) g = c; }
        }
      }
    }
    girth = isFinite(g) ? g : -1;
  }

  // ── All-pairs BFS, n ≤ 300 (distance-based indices) ──────────────────────
  let distMatrix = null;
  if (isConnected && n <= 300) {
    distMatrix = [];
    for (let s = 0; s < n; s++) {
      const d = new Int32Array(n).fill(-1); d[s] = 0;
      const q = [s];
      for (let h = 0; h < q.length; h++) {
        const v = q[h];
        for (const u of adj[v]) if (d[u] === -1) { d[u] = d[v] + 1; q.push(u); }
      }
      distMatrix.push(d);
    }
  }

  let wiener = null, harary = null, hyperWiener = null, avgDist = null;
  let degDist = null, gutman = null, radius = null;
  let mostar = null, szeged = null, piIndex = null;
  let totalEcc = null, avgEcc = null, eccConn = null, connEcc = null;

  if (distMatrix) {
    wiener = 0; harary = 0; hyperWiener = 0; degDist = 0; gutman = 0;
    const eccs = distMatrix.map(d => Math.max(...d));
    radius   = Math.min(...eccs);
    totalEcc = eccs.reduce((s, e) => s + e, 0);
    avgEcc   = +(totalEcc / n).toFixed(4);
    eccConn  = eccs.reduce((s, e, i) => s + degrees[i] * e, 0);
    connEcc  = +eccs.reduce((s, e, i) => s + (e > 0 ? degrees[i] / e : 0), 0).toFixed(4);
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const d = distMatrix[i][j];
        wiener      += d;
        harary      += 1 / d;
        hyperWiener += d + d * d;
        degDist     += (degrees[i] + degrees[j]) * d;
        gutman      += degrees[i] * degrees[j] * d;
      }
    harary  = +harary.toFixed(4);
    avgDist = n > 1 ? +(wiener / (n * (n - 1) / 2)).toFixed(4) : 0;

    // Szeged, PI, Mostar (n ≤ 100)
    if (n <= 100) {
      szeged = 0; piIndex = 0; mostar = 0;
      for (let u = 0; u < n; u++)
        for (const v of adj[u]) if (v > u) {
          let nu = 0, nv = 0;
          for (let w = 0; w < n; w++) {
            if (distMatrix[u][w] < distMatrix[v][w]) nu++;
            else if (distMatrix[v][w] < distMatrix[u][w]) nv++;
          }
          szeged  += nu * nv;
          piIndex += nu + nv;
          mostar  += Math.abs(nu - nv);
        }
    }
  }

  // ── Spectral (Jacobi), n ≤ 20 ─────────────────────────────────────────────
  let adjSpectrum = null, energy = null, spectralRadius = null, estrada = null;
  let lapSpectrum = null, fiedler = null, lel = null, spanningTrees = null;
  let slSpectrum = null, slEnergy = null;

  if (n <= 20 && n > 0) {
    const Amat = Array.from({length: n}, (_, i) => {
      const row = new Float64Array(n); adj[i].forEach(j => { row[j] = 1; }); return row;
    });
    const eigA = jacobiEig(Amat, n).sort((a, b) => b - a);
    adjSpectrum    = eigA.map(e => +e.toFixed(4));
    energy         = +eigA.reduce((s, e) => s + Math.abs(e), 0).toFixed(4);
    spectralRadius = +Math.max(...eigA.map(Math.abs)).toFixed(4);
    estrada        = +eigA.reduce((s, e) => s + Math.exp(e), 0).toFixed(4);

    const Lmat = Array.from({length: n}, (_, i) => {
      const row = new Float64Array(n); row[i] = degrees[i]; adj[i].forEach(j => { row[j] = -1; }); return row;
    });
    const eigL = jacobiEig(Lmat, n).map(e => Math.max(0, e)).sort((a, b) => a - b);
    lapSpectrum = eigL.map(e => +e.toFixed(4));
    fiedler = lapSpectrum[1] ?? 0;
    const avgD = n > 0 ? 2 * m / n : 0;
    lel = +eigL.reduce((s, e) => s + Math.abs(e - avgD), 0).toFixed(4);
    if (isConnected) {
      const nz = eigL.filter(e => e > 0.1);
      if (nz.length === n - 1) spanningTrees = Math.round(nz.reduce((p, e) => p * e, 1) / n);
    }

    // Signless Laplacian Q = D + A
    const Qmat = Array.from({length: n}, (_, i) => {
      const row = new Float64Array(n); row[i] = degrees[i]; adj[i].forEach(j => { row[j] = 1; }); return row;
    });
    const eigQ = jacobiEig(Qmat, n).sort((a, b) => b - a);
    slSpectrum = eigQ.map(e => +e.toFixed(4));
    slEnergy   = +eigQ.reduce((s, e) => s + Math.abs(e), 0).toFixed(4);
  }

  // ── Max matching (augmenting-path DFS) ────────────────────────────────────
  const match = new Int32Array(n).fill(-1);
  let matchingSize = 0;
  for (let v = 0; v < n; v++) {
    if (match[v] === -1) {
      const vis = new Uint8Array(n); vis[v] = 1;
      if (augmentMatch(v, adj, match, vis)) matchingSize++;
    }
  }

  // ── Hamiltonian (backtracking, n ≤ 15) ───────────────────────────────────
  let hamiltonianCycle = null, hamiltonianPath = null;
  if (n >= 3 && n <= 15) {
    hamiltonianCycle = hamCycle(0, n, amat);
    hamiltonianPath  = hamiltonianCycle || hamPath(n, amat);
  }

  // ── Prüfer sequence (tree, 3 ≤ n ≤ 30) ───────────────────────────────────
  let pruferSeq = null;
  if (isTree && n >= 3 && n <= 30) {
    const deg2 = [...degrees]; pruferSeq = [];
    const removed = new Uint8Array(n);
    for (let step = 0; step < n - 2; step++) {
      let leaf = -1;
      for (let i = 0; i < n; i++) if (!removed[i] && deg2[i] === 1) { leaf = i; break; }
      if (leaf === -1) break;
      const nb = adj[leaf].find(u => !removed[u]);
      if (nb === undefined) break;
      pruferSeq.push(nb); removed[leaf] = 1; deg2[nb]--;
    }
  }

  return {
    isTree, isRegular, regularDeg: isRegular ? degrees[0] : null,
    triangles, quadrangles, girth, pruferSeq, spanningTrees,
    m1, m2, forgotten,
    randic: +randic.toFixed(4), harmonic: +harmonic.toFixed(4), albertson,
    ga: +ga.toFixed(4), sumConn: +sumConn.toFixed(4), azi: +azi.toFixed(4),
    chromaticIndex,
    wiener, harary, hyperWiener, avgDist, degDist, gutman,
    mostar, szeged, piIndex,
    radius, totalEcc, avgEcc, eccConn, connEcc,
    adjSpectrum, energy, spectralRadius, estrada,
    lapSpectrum, fiedler, lel, slSpectrum, slEnergy,
    matchingSize, hamiltonianCycle, hamiltonianPath,
    distComputed: distMatrix !== null,
  };
}
