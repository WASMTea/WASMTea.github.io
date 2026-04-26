// Graph generators — each returns { n, edges: [[u,v], …] } with 0-indexed vertices.
// params descriptors: { id, label, type:'int'|'float', default, min, max, step? }

export const CATEGORIES = [
  {
    id: 'classic', label: 'Classic Graphs', open: true,
    generators: [
      {
        id: 'complete', label: 'Complete Kₙ', layout: 'circle',
        note: 'Every pair of vertices is connected',
        params: [{id:'n', label:'n', type:'int', default:5, min:2, max:30}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n; i++)
            for (let j = i+1; j < n; j++) edges.push([i, j]);
          return { n, edges };
        },
      },
      {
        id: 'cycle', label: 'Cycle Cₙ', layout: 'circle',
        note: 'Ring of n vertices',
        params: [{id:'n', label:'n', type:'int', default:6, min:3, max:100}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n; i++) edges.push([i, (i+1)%n]);
          return { n, edges };
        },
      },
      {
        id: 'path', label: 'Path Pₙ', layout: 'path',
        note: 'Linear chain of n vertices',
        params: [{id:'n', label:'n', type:'int', default:6, min:2, max:100}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n-1; i++) edges.push([i, i+1]);
          return { n, edges };
        },
      },
      {
        id: 'star', label: 'Star K₁,ₙ', layout: 'star',
        note: 'Hub (vertex 0) connected to n leaves',
        params: [{id:'n', label:'leaves n', type:'int', default:5, min:1, max:60}],
        build({n}) {
          const edges = [];
          for (let i = 1; i <= n; i++) edges.push([0, i]);
          return { n: n+1, edges };
        },
      },
      {
        id: 'wheel', label: 'Wheel Wₙ', layout: 'wheel',
        note: 'Hub connected to every vertex of an n-cycle',
        params: [{id:'n', label:'rim n', type:'int', default:6, min:3, max:60}],
        build({n}) {
          const edges = [];
          for (let i = 1; i <= n; i++) {
            edges.push([0, i]);
            edges.push([i, i%n + 1]);
          }
          return { n: n+1, edges };
        },
      },
      {
        id: 'petersen', label: 'Petersen', layout: 'two-circle',
        note: 'Classic 3-regular graph on 10 vertices',
        params: [],
        build() {
          const edges = [];
          for (let i = 0; i < 5; i++) edges.push([i, (i+1)%5]);
          for (let i = 0; i < 5; i++) edges.push([5+i, 5+(i+2)%5]);
          for (let i = 0; i < 5; i++) edges.push([i, 5+i]);
          return { n: 10, edges };
        },
      },
      {
        id: 'gen_petersen', label: 'Gen. Petersen G(n,k)', layout: 'two-circle',
        note: 'Outer n-cycle + spokes + inner star polygon with skip k',
        params: [
          {id:'n', label:'n', type:'int', default:5, min:3, max:30},
          {id:'k', label:'k', type:'int', default:2, min:1, max:14},
        ],
        build({n, k}) {
          const edges = [];
          for (let i = 0; i < n; i++) edges.push([i, (i+1)%n]);
          for (let i = 0; i < n; i++) edges.push([i, n+i]);
          for (let i = 0; i < n; i++) edges.push([n+i, n+(i+k)%n]);
          return { n: 2*n, edges };
        },
      },
      {
        id: 'tadpole', label: 'Tadpole T(n,k)', layout: 'tadpole',
        note: 'Cycle Cₙ with a path of k vertices attached',
        params: [
          {id:'n', label:'cycle n', type:'int', default:5, min:3, max:30},
          {id:'k', label:'tail k', type:'int', default:3, min:1, max:20},
        ],
        build({n, k}) {
          const edges = [];
          for (let i = 0; i < n; i++) edges.push([i, (i+1)%n]);
          edges.push([0, n]);
          for (let i = n; i < n+k-1; i++) edges.push([i, i+1]);
          return { n: n+k, edges };
        },
      },
    ],
  },

  {
    id: 'trees', label: 'Trees', open: false,
    generators: [
      {
        id: 'complete_tree', label: 'Complete d-ary Tree', layout: 'tree',
        note: 'Regular rooted tree: d children per node, h levels',
        params: [
          {id:'d', label:'d (branching)', type:'int', default:2, min:2, max:5},
          {id:'h', label:'h (height)', type:'int', default:3, min:1, max:5},
        ],
        build({d, h}) {
          let n = 0, pow = 1;
          for (let i = 0; i <= h; i++) { n += pow; pow *= d; }
          n = Math.min(n, 500);
          const edges = [];
          for (let i = 1; i < n; i++) edges.push([Math.floor((i-1)/d), i]);
          return { n, edges };
        },
      },
      {
        id: 'banana_tree', label: 'Banana Tree B(n,k)', layout: 'tree',
        note: 'Root + n copies of K₁,ₖ₋₁ each attached to root',
        params: [
          {id:'n', label:'n (stars)', type:'int', default:3, min:1, max:10},
          {id:'k', label:'k (star size)', type:'int', default:3, min:2, max:10},
        ],
        build({n, k}) {
          const edges = [];
          for (let i = 0; i < n; i++) {
            const center = 1 + i*k;
            edges.push([0, center]);
            for (let j = 1; j < k; j++) edges.push([center, center+j]);
          }
          return { n: 1 + n*k, edges };
        },
      },
      {
        id: 'random_tree', label: 'Random Tree', layout: 'tree',
        note: 'Uniform random labeled tree via Prüfer sequence',
        params: [{id:'n', label:'n', type:'int', default:10, min:2, max:100}],
        build({n}) {
          if (n === 2) return { n: 2, edges: [[0, 1]] };
          const seq = Array.from({length: n-2}, () => Math.floor(Math.random()*n));
          const degree = new Array(n).fill(1);
          seq.forEach(v => degree[v]++);
          const edges = [];
          for (const u of seq) {
            const v = degree.findIndex(d => d === 1);
            edges.push([v, u]);
            degree[v]--; degree[u]--;
          }
          const rem = [];
          degree.forEach((d, i) => { if (d === 1) rem.push(i); });
          edges.push([rem[0], rem[1]]);
          return { n, edges };
        },
      },
    ],
  },

  {
    id: 'bipartite', label: 'Bipartite & Multipartite', open: false,
    generators: [
      {
        id: 'complete_bipartite', label: 'Complete Bipartite K(m,n)', layout: 'bipartite',
        note: 'All edges between two independent groups of size m and n',
        params: [
          {id:'m', label:'m', type:'int', default:3, min:1, max:20},
          {id:'n', label:'n', type:'int', default:4, min:1, max:20},
        ],
        build({m, n}) {
          const edges = [];
          for (let i = 0; i < m; i++)
            for (let j = 0; j < n; j++) edges.push([i, m+j]);
          return { n: m+n, edges };
        },
      },
      {
        id: 'tripartite', label: 'Tripartite K(m,n,o)', layout: 'tripartite',
        note: 'All cross-edges among three independent groups',
        params: [
          {id:'m', label:'m', type:'int', default:2, min:1, max:10},
          {id:'n', label:'n', type:'int', default:3, min:1, max:10},
          {id:'o', label:'o', type:'int', default:2, min:1, max:10},
        ],
        build({m, n, o}) {
          const edges = [];
          for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) edges.push([i, m+j]);
            for (let j = 0; j < o; j++) edges.push([i, m+n+j]);
          }
          for (let i = 0; i < n; i++)
            for (let j = 0; j < o; j++) edges.push([m+i, m+n+j]);
          return { n: m+n+o, edges };
        },
      },
      {
        id: 'crown', label: 'Crown Graph Sₙ⁰', layout: 'bipartite',
        note: 'K(n,n) minus perfect matching',
        params: [{id:'n', label:'n', type:'int', default:4, min:2, max:15}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
              if (i !== j) edges.push([i, n+j]);
          return { n: 2*n, edges };
        },
      },
      {
        id: 'cocktail_party', label: 'Cocktail Party CPₙ', layout: 'circle',
        note: 'K₂ₙ minus a perfect matching (n pairs removed)',
        params: [{id:'n', label:'n (pairs)', type:'int', default:3, min:2, max:10}],
        build({n}) {
          const total = 2*n, edges = [];
          for (let i = 0; i < total; i++)
            for (let j = i+1; j < total; j++)
              if (Math.floor(i/2) !== Math.floor(j/2)) edges.push([i, j]);
          return { n: total, edges };
        },
      },
    ],
  },

  {
    id: 'web', label: 'Web-Class Graphs', open: false,
    generators: [
      {
        id: 'prism', label: 'Prism Graph Yₙ', layout: 'two-circle',
        note: 'Two n-cycles joined by n spokes (n-prism)',
        params: [{id:'n', label:'n', type:'int', default:5, min:3, max:30}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n; i++) {
            edges.push([i, (i+1)%n]);
            edges.push([n+i, n+(i+1)%n]);
            edges.push([i, n+i]);
          }
          return { n: 2*n, edges };
        },
      },
      {
        id: 'antiprism', label: 'Antiprism APₙ', layout: 'two-circle',
        note: 'Two n-cycles with alternating diagonal cross-edges',
        params: [{id:'n', label:'n', type:'int', default:4, min:3, max:30}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n; i++) {
            edges.push([i, (i+1)%n]);
            edges.push([n+i, n+(i+1)%n]);
            edges.push([i, n+i]);
            edges.push([(i+1)%n, n+i]);
          }
          return { n: 2*n, edges };
        },
      },
      {
        id: 'gear', label: 'Gear Graph Gₙ', layout: 'wheel',
        note: 'Wheel with extra vertices subdividing alternate spokes',
        params: [{id:'n', label:'n', type:'int', default:5, min:3, max:20}],
        build({n}) {
          const edges = [];
          for (let i = 1; i <= 2*n; i++) edges.push([i, i%(2*n)+1]);
          for (let i = 1; i <= 2*n; i += 2) edges.push([0, i]);
          return { n: 2*n+1, edges };
        },
      },
      {
        id: 'helm', label: 'Helm Graph Hₙ', layout: 'helm',
        note: 'Wheel with a pendant vertex on every rim vertex',
        params: [{id:'n', label:'n', type:'int', default:5, min:3, max:20}],
        build({n}) {
          const edges = [];
          for (let i = 1; i <= n; i++) {
            edges.push([0, i]);
            edges.push([i, i%n+1]);
            edges.push([i, n+i]);
          }
          return { n: 2*n+1, edges };
        },
      },
      {
        id: 'flower', label: 'Flower Graph Fₙ', layout: 'helm',
        note: 'Helm plus edges from each pendant back to the hub',
        params: [{id:'n', label:'n', type:'int', default:5, min:3, max:20}],
        build({n}) {
          const edges = [];
          for (let i = 1; i <= n; i++) {
            edges.push([0, i]);
            edges.push([i, i%n+1]);
            edges.push([i, n+i]);
            edges.push([n+i, 0]);
          }
          return { n: 2*n+1, edges };
        },
      },
      {
        id: 'sunlet', label: 'Sunlet Sₙ', layout: 'sunlet',
        note: 'Cycle with one pendant vertex per vertex (Cₙ⊙K₁)',
        params: [{id:'n', label:'n', type:'int', default:5, min:3, max:30}],
        build({n}) {
          const edges = [];
          for (let i = 0; i < n; i++) {
            edges.push([i, (i+1)%n]);
            edges.push([i, n+i]);
          }
          return { n: 2*n, edges };
        },
      },
    ],
  },

  {
    id: 'grids', label: 'Grids & Products', open: false,
    generators: [
      {
        id: 'grid_mn', label: 'Grid P(m×n)', layout: 'grid',
        note: 'Rectangular lattice with m rows and n columns',
        params: [
          {id:'m', label:'rows m', type:'int', default:4, min:2, max:20},
          {id:'n', label:'cols n', type:'int', default:5, min:2, max:20},
        ],
        build({m, n}) {
          const edges = [];
          for (let r = 0; r < m; r++)
            for (let c = 0; c < n; c++) {
              const v = r*n+c;
              if (c < n-1) edges.push([v, v+1]);
              if (r < m-1) edges.push([v, v+n]);
            }
          return { n: m*n, edges };
        },
      },
      {
        id: 'toroidal_mn', label: 'Toroidal Grid C(m×n)', layout: 'grid',
        note: 'Grid with wrap-around edges in both dimensions',
        params: [
          {id:'m', label:'rows m', type:'int', default:4, min:2, max:15},
          {id:'n', label:'cols n', type:'int', default:5, min:2, max:15},
        ],
        build({m, n}) {
          const seen = new Set(), edges = [];
          function addE(u, v) {
            const k = u < v ? `${u},${v}` : `${v},${u}`;
            if (!seen.has(k)) { seen.add(k); edges.push([u, v]); }
          }
          for (let r = 0; r < m; r++)
            for (let c = 0; c < n; c++) {
              const v = r*n+c;
              addE(v, r*n + (c+1)%n);
              addE(v, ((r+1)%m)*n + c);
            }
          return { n: m*n, edges };
        },
      },
    ],
  },

  {
    id: 'random', label: 'Random Graphs', open: false,
    generators: [
      {
        id: 'random_er', label: 'Erdős–Rényi G(n,p)', layout: 'circle',
        note: 'Each possible edge included independently with probability p',
        params: [
          {id:'n', label:'n', type:'int',   default:20,  min:2,    max:300},
          {id:'p', label:'p', type:'float', default:0.25, min:0.01, max:1, step:0.01},
        ],
        build({n, p}) {
          const edges = [];
          for (let i = 0; i < n; i++)
            for (let j = i+1; j < n; j++)
              if (Math.random() < p) edges.push([i, j]);
          return { n, edges };
        },
      },
      {
        id: 'barabasi', label: 'Barabási–Albert', layout: 'circle',
        note: 'Preferential attachment — generates scale-free networks',
        params: [
          {id:'n', label:'n', type:'int', default:30,  min:3, max:500},
          {id:'m', label:'m (new edges)', type:'int', default:2, min:1, max:10},
        ],
        build({n, m}) {
          const adj = [new Set([1]), new Set([0])];
          const deg = [1, 1]; let total = 2;
          for (let i = 2; i < n; i++) {
            adj.push(new Set()); deg.push(0);
            const mAct = Math.min(m, i);
            const attached = new Set();
            let tries = 0;
            while (attached.size < mAct && tries++ < 1000) {
              let r = Math.random()*total, cum = 0;
              for (let j = 0; j < i; j++) {
                cum += deg[j];
                if (cum >= r && !attached.has(j)) { attached.add(j); break; }
              }
            }
            attached.forEach(j => {
              adj[i].add(j); adj[j].add(i);
              deg[i]++; deg[j]++; total += 2;
            });
          }
          const edges = [];
          for (let i = 0; i < n; i++)
            adj[i].forEach(j => { if (j > i) edges.push([i, j]); });
          return { n, edges };
        },
      },
      {
        id: 'watts_strogatz', label: 'Watts–Strogatz', layout: 'circle',
        note: 'Ring lattice with random rewiring — small-world network',
        params: [
          {id:'n',    label:'n',           type:'int',   default:20, min:4,  max:200},
          {id:'k',    label:'k (neighbors)',type:'int',   default:4,  min:2,  max:20},
          {id:'beta', label:'β (rewire)',   type:'float', default:0.3, min:0, max:1, step:0.05},
        ],
        build({n, k, beta}) {
          const kH = Math.floor(k/2);
          const adj = Array.from({length: n}, () => new Set());
          for (let i = 0; i < n; i++)
            for (let d = 1; d <= kH; d++) {
              const j = (i+d)%n;
              adj[i].add(j); adj[j].add(i);
            }
          for (let i = 0; i < n; i++)
            for (let d = 1; d <= kH; d++) {
              const j = (i+d)%n;
              if (!adj[i].has(j)) continue; // already rewired
              if (Math.random() < beta) {
                let newJ, tries = 0;
                do { newJ = Math.floor(Math.random()*n); tries++; }
                while ((newJ === i || adj[i].has(newJ)) && tries < 100);
                if (tries < 100) {
                  adj[i].delete(j); adj[j].delete(i);
                  adj[i].add(newJ); adj[newJ].add(i);
                }
              }
            }
          const edges = [];
          for (let i = 0; i < n; i++)
            adj[i].forEach(j => { if (j > i) edges.push([i, j]); });
          return { n, edges };
        },
      },
      {
        id: 'k_regular', label: 'k-Regular (Circulant)', layout: 'circle',
        note: 'Each vertex connected to k nearest neighbors on a ring',
        params: [
          {id:'n', label:'n', type:'int', default:12, min:4, max:100},
          {id:'k', label:'k (degree, even)', type:'int', default:4, min:2, max:20},
        ],
        build({n, k}) {
          const kH = Math.floor(k/2);
          const seen = new Set(), edges = [];
          for (let i = 0; i < n; i++)
            for (let d = 1; d <= kH; d++) {
              const j = (i+d)%n;
              const key = `${Math.min(i,j)},${Math.max(i,j)}`;
              if (!seen.has(key)) { seen.add(key); edges.push([i, j]); }
            }
          return { n, edges };
        },
      },
    ],
  },

  {
    id: 'named', label: 'Named Graphs', open: false,
    generators: [
      {
        id: 'frucht', label: 'Frucht Graph', layout: 'circle',
        note: '12 vertices, 18 edges — trivial automorphism group',
        params: [],
        build() {
          return { n: 12, edges: [
            [0,1],[0,2],[0,3],[1,4],[1,5],[2,4],[2,6],[3,7],[3,8],
            [4,9],[5,6],[5,10],[6,11],[7,9],[7,10],[8,9],[8,11],[10,11],
          ]};
        },
      },
      {
        id: 'grotzsch', label: 'Grötzsch Graph', layout: 'grotzsch',
        note: '11 vertices, 20 edges — triangle-free, χ = 4 (Mycielski of C₅)',
        params: [],
        build() {
          const edges = [];
          // C5 (outer): 0-1-2-3-4-0
          for (let i = 0; i < 5; i++) edges.push([i, (i+1)%5]);
          // Shadow edges: for each C5 edge {i, j}, add {5+i, j} and {i, 5+j}
          for (let i = 0; i < 5; i++) {
            const j = (i+1)%5;
            edges.push([5+i, j]);
            edges.push([i, 5+j]);
          }
          // Hub (10) to all shadow vertices
          for (let i = 0; i < 5; i++) edges.push([10, 5+i]);
          return { n: 11, edges };
        },
      },
      {
        id: 'heawood', label: 'Heawood Graph', layout: 'two-circle',
        note: '14 vertices, 21 edges — 3-regular bipartite, girth 6',
        params: [],
        build() {
          const edges = [];
          for (let i = 0; i < 14; i++) edges.push([i, (i+1)%14]);
          const lcf = [5, -5];
          for (let i = 0; i < 14; i++) {
            const j = ((i + lcf[i%2]) % 14 + 14) % 14;
            if (j > i) edges.push([i, j]);
          }
          return { n: 14, edges };
        },
      },
      {
        id: 'pappus', label: 'Pappus Graph', layout: 'two-circle',
        note: '18 vertices, 27 edges — 3-regular bipartite',
        params: [],
        build() {
          const edges = [];
          for (let i = 0; i < 18; i++) edges.push([i, (i+1)%18]);
          const lcf = [5, 7, -7, 7, -7, -5];
          for (let i = 0; i < 18; i++) {
            const j = ((i + lcf[i%6]) % 18 + 18) % 18;
            if (j > i) edges.push([i, j]);
          }
          return { n: 18, edges };
        },
      },
      {
        id: 'zachary', label: 'Zachary Karate Club', layout: 'circle',
        note: '34 vertices, 78 edges — classic community-detection benchmark',
        params: [],
        build() {
          return { n: 34, edges: [
            [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,10],[0,11],[0,12],[0,13],[0,17],[0,19],[0,21],[0,31],
            [1,2],[1,3],[1,7],[1,13],[1,17],[1,19],[1,21],[1,30],
            [2,3],[2,7],[2,8],[2,9],[2,13],[2,27],[2,28],[2,32],
            [3,7],[3,12],[3,13],
            [4,6],[4,10],
            [5,6],[5,10],[5,16],
            [6,16],
            [8,30],[8,32],[8,33],
            [9,33],
            [13,33],
            [14,32],[14,33],
            [15,32],[15,33],
            [18,32],[18,33],
            [19,33],
            [20,32],[20,33],
            [22,32],[22,33],
            [23,25],[23,27],[23,29],[23,32],[23,33],
            [24,25],[24,27],[24,31],
            [25,31],
            [26,29],[26,33],
            [27,33],
            [28,31],[28,33],
            [29,32],[29,33],
            [30,32],[30,33],
            [31,32],[31,33],
            [32,33],
          ]};
        },
      },
    ],
  },
];

export const ALL_GENERATORS = CATEGORIES.flatMap(cat =>
  cat.generators.map(gen => ({ ...gen, category: cat.id }))
);

export function findGenerator(id) {
  return ALL_GENERATORS.find(g => g.id === id);
}
