import { describe, it, expect } from 'vitest';
import {
  FORMATS,
  toJSON, fromJSON,
  toGraphML, fromGraphML,
  toGML, fromGML,
  toDOT, fromDOT,
  toCSV, fromCSV,
  toG6, fromG6,
  serialize, deserialize,
} from '../js/io.js';

// ── helpers ───────────────────────────────────────────────────────────────────

const triangle = {
  n: 3,
  edges: [[0,1],[1,2],[0,2]],
  vertices: [{x:0,y:0},{x:100,y:0},{x:50,y:86}],
};

const withLabels = {
  n: 3,
  edges: [[0,1],[1,2]],
  vertices: [{x:10,y:20,label:'A'},{x:30,y:40,label:'B'},{x:50,y:60,label:'C'}],
};

const noPos = {
  n: 4,
  edges: [[0,1],[1,2],[2,3],[3,0]],
};

const empty = { n: 0, edges: [] };
const single = { n: 1, edges: [] };
const isolated = { n: 3, edges: [] };
const star4 = { n: 5, edges: [[0,1],[0,2],[0,3],[0,4]] };
const path5 = { n: 5, edges: [[0,1],[1,2],[2,3],[3,4]] };

function edgeSet(edges) {
  return new Set(edges.map(([u,v]) => `${Math.min(u,v)}-${Math.max(u,v)}`));
}

function sameTopology(a, b) {
  if (a.n !== b.n) return false;
  const sa = edgeSet(a.edges), sb = edgeSet(b.edges);
  if (sa.size !== sb.size) return false;
  for (const e of sa) if (!sb.has(e)) return false;
  return true;
}

function approxPos(a, b, tol = 0.5) {
  if (!a.vertices || !b.vertices) return false;
  if (a.vertices.length !== b.vertices.length) return false;
  return a.vertices.every((v, i) => {
    const w = b.vertices[i];
    return Math.abs((v.x ?? 0) - (w.x ?? 0)) <= tol &&
           Math.abs((v.y ?? 0) - (w.y ?? 0)) <= tol;
  });
}

// ── FORMATS export ────────────────────────────────────────────────────────────

describe('FORMATS', () => {
  it('exports an array with 6 entries', () => {
    expect(Array.isArray(FORMATS)).toBe(true);
    expect(FORMATS.length).toBe(6);
  });

  it('each entry has id, label, ext, mime', () => {
    for (const f of FORMATS) {
      expect(typeof f.id).toBe('string');
      expect(typeof f.label).toBe('string');
      expect(f.ext.startsWith('.')).toBe(true);
      expect(typeof f.mime).toBe('string');
    }
  });

  it('ids are unique', () => {
    const ids = FORMATS.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has json, graphml, gml, dot, csv', () => {
    const ids = new Set(FORMATS.map(f => f.id));
    for (const id of ['json','graphml','gml','dot','csv']) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

// ── JSON ──────────────────────────────────────────────────────────────────────

describe('JSON round-trip', () => {
  it('empty graph', () => {
    const rt = fromJSON(toJSON(empty));
    expect(rt.n).toBe(0);
    expect(rt.edges).toEqual([]);
  });

  it('topology preserved', () => {
    const rt = fromJSON(toJSON(noPos));
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('positions preserved', () => {
    const rt = fromJSON(toJSON(triangle));
    expect(approxPos(rt, triangle)).toBe(true);
  });

  it('labels preserved', () => {
    const rt = fromJSON(toJSON(withLabels));
    expect(rt.vertices[0].label).toBe('A');
    expect(rt.vertices[2].label).toBe('C');
  });

  it('single vertex', () => {
    const rt = fromJSON(toJSON(single));
    expect(rt.n).toBe(1);
    expect(rt.edges).toEqual([]);
  });

  it('produces valid JSON text', () => {
    const text = toJSON(triangle);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it('serialize/deserialize dispatch', () => {
    const text = serialize(triangle, 'json');
    const rt = deserialize(text, 'graph.json');
    expect(sameTopology(rt, triangle)).toBe(true);
  });
});

// ── GraphML ───────────────────────────────────────────────────────────────────

describe('GraphML round-trip', () => {
  it('empty graph', () => {
    const rt = fromGraphML(toGraphML(empty));
    expect(rt.n).toBe(0);
    expect(rt.edges).toEqual([]);
  });

  it('topology preserved (with positions)', () => {
    const rt = fromGraphML(toGraphML(triangle));
    expect(sameTopology(rt, triangle)).toBe(true);
  });

  it('positions preserved', () => {
    const rt = fromGraphML(toGraphML(triangle));
    expect(approxPos(rt, triangle)).toBe(true);
  });

  it('topology preserved (no positions)', () => {
    const rt = fromGraphML(toGraphML(noPos));
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('labels preserved', () => {
    const rt = fromGraphML(toGraphML(withLabels));
    expect(rt.vertices[0].label).toBe('A');
    expect(rt.vertices[2].label).toBe('C');
  });

  it('output starts with XML header', () => {
    expect(toGraphML(triangle)).toMatch(/^<\?xml/);
  });

  it('contains <graphml> root', () => {
    expect(toGraphML(star4)).toContain('<graphml');
  });

  it('single vertex', () => {
    const rt = fromGraphML(toGraphML(single));
    expect(rt.n).toBe(1);
    expect(rt.edges).toEqual([]);
  });

  it('isolated vertices', () => {
    const rt = fromGraphML(toGraphML(isolated));
    expect(rt.n).toBe(3);
    expect(rt.edges).toEqual([]);
  });

  it('serialize/deserialize dispatch', () => {
    const text = serialize(triangle, 'graphml');
    const rt = deserialize(text, 'graph.graphml');
    expect(sameTopology(rt, triangle)).toBe(true);
  });

  it('XML-escapes special chars in labels', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 0, y: 0, label: '<A&B>' }] };
    const text = toGraphML(d);
    expect(text).toContain('&lt;A&amp;B&gt;');
  });
});

// ── GML ───────────────────────────────────────────────────────────────────────

describe('GML round-trip', () => {
  it('empty graph', () => {
    const rt = fromGML(toGML(empty));
    expect(rt.n).toBe(0);
    expect(rt.edges).toEqual([]);
  });

  it('topology preserved (with positions)', () => {
    const rt = fromGML(toGML(triangle));
    expect(sameTopology(rt, triangle)).toBe(true);
  });

  it('positions preserved', () => {
    const rt = fromGML(toGML(triangle));
    expect(approxPos(rt, triangle)).toBe(true);
  });

  it('topology preserved (no positions)', () => {
    const rt = fromGML(toGML(noPos));
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('labels preserved', () => {
    const rt = fromGML(toGML(withLabels));
    expect(rt.vertices?.[0]?.label).toBe('A');
    expect(rt.vertices?.[2]?.label).toBe('C');
  });

  it('output starts with graph [', () => {
    expect(toGML(triangle).trimStart()).toMatch(/^graph\s*\[/);
  });

  it('single vertex', () => {
    const rt = fromGML(toGML(single));
    expect(rt.n).toBe(1);
    expect(rt.edges).toEqual([]);
  });

  it('isolated vertices', () => {
    const rt = fromGML(toGML(isolated));
    expect(rt.n).toBe(3);
    expect(rt.edges).toEqual([]);
  });

  it('serialize/deserialize dispatch', () => {
    const text = serialize(triangle, 'gml');
    const rt = deserialize(text, 'graph.gml');
    expect(sameTopology(rt, triangle)).toBe(true);
  });

  it('path graph', () => {
    const rt = fromGML(toGML(path5));
    expect(sameTopology(rt, path5)).toBe(true);
  });
});

// ── DOT ───────────────────────────────────────────────────────────────────────

describe('DOT round-trip', () => {
  it('empty graph', () => {
    const rt = fromDOT(toDOT(empty));
    expect(rt.n).toBe(0);
    expect(rt.edges).toEqual([]);
  });

  it('topology preserved', () => {
    const rt = fromDOT(toDOT(noPos));
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('output starts with graph keyword', () => {
    expect(toDOT(triangle)).toMatch(/^graph/);
  });

  it('uses -- for undirected edges', () => {
    expect(toDOT(triangle)).toContain('--');
  });

  it('custom graph name', () => {
    expect(toDOT(triangle, 'MyGraph')).toContain('graph MyGraph');
  });

  it('single vertex', () => {
    const rt = fromDOT(toDOT(single));
    expect(rt.n).toBe(1);
    expect(rt.edges).toEqual([]);
  });

  it('isolated vertices', () => {
    const rt = fromDOT(toDOT(isolated));
    expect(rt.n).toBe(3);
    expect(rt.edges).toEqual([]);
  });

  it('star graph topology', () => {
    const rt = fromDOT(toDOT(star4));
    expect(sameTopology(rt, star4)).toBe(true);
  });

  it('path graph topology', () => {
    const rt = fromDOT(toDOT(path5));
    expect(sameTopology(rt, path5)).toBe(true);
  });

  it('serialize/deserialize dispatch (.dot)', () => {
    const text = serialize(noPos, 'dot');
    const rt = deserialize(text, 'graph.dot');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('serialize/deserialize dispatch (.gv)', () => {
    const text = serialize(noPos, 'dot');
    const rt = deserialize(text, 'graph.gv');
    expect(sameTopology(rt, noPos)).toBe(true);
  });
});

// ── CSV ───────────────────────────────────────────────────────────────────────

describe('CSV round-trip', () => {
  it('empty graph', () => {
    const rt = fromCSV(toCSV(empty));
    expect(rt.n).toBe(0);
    expect(rt.edges).toEqual([]);
  });

  it('topology preserved', () => {
    const rt = fromCSV(toCSV(noPos));
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('has comment header lines', () => {
    const text = toCSV(triangle);
    expect(text).toMatch(/^#/);
  });

  it('vertex count in header', () => {
    const text = toCSV(noPos);
    expect(text).toContain('vertices: 4');
  });

  it('single vertex', () => {
    const rt = fromCSV(toCSV(single));
    expect(rt.n).toBe(1);
    expect(rt.edges).toEqual([]);
  });

  it('path graph', () => {
    const rt = fromCSV(toCSV(path5));
    expect(sameTopology(rt, path5)).toBe(true);
  });

  it('star graph', () => {
    const rt = fromCSV(toCSV(star4));
    expect(sameTopology(rt, star4)).toBe(true);
  });

  it('serialize/deserialize dispatch', () => {
    const text = serialize(noPos, 'csv');
    const rt = deserialize(text, 'graph.csv');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('handles CSV without header comment', () => {
    const raw = '0,1\n1,2\n2,3';
    const rt = fromCSV(raw);
    expect(rt.n).toBe(4);
    expect(rt.edges.length).toBe(3);
  });

  it('handles space-separated edge list', () => {
    const raw = '0 1\n1 2\n2 0';
    const rt = fromCSV(raw);
    expect(rt.edges.length).toBe(3);
  });
});

// ── Graph6 ────────────────────────────────────────────────────────────────────

describe('Graph6 round-trip', () => {
  it('empty graph (n=0)', () => {
    const rt = fromG6(toG6(empty));
    expect(rt.n).toBe(0);
    expect(rt.edges).toEqual([]);
  });

  it('single vertex (n=1)', () => {
    const rt = fromG6(toG6(single));
    expect(rt.n).toBe(1);
    expect(rt.edges).toEqual([]);
  });

  it('isolated vertices', () => {
    const rt = fromG6(toG6(isolated));
    expect(rt.n).toBe(3);
    expect(rt.edges).toEqual([]);
  });

  it('triangle topology preserved', () => {
    const rt = fromG6(toG6(triangle));
    expect(sameTopology(rt, triangle)).toBe(true);
  });

  it('4-cycle (noPos) topology preserved', () => {
    const rt = fromG6(toG6(noPos));
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('star graph topology preserved', () => {
    const rt = fromG6(toG6(star4));
    expect(sameTopology(rt, star4)).toBe(true);
  });

  it('path graph topology preserved', () => {
    const rt = fromG6(toG6(path5));
    expect(sameTopology(rt, path5)).toBe(true);
  });

  it('output is a single printable ASCII line', () => {
    const text = toG6(noPos).trim();
    expect(text.split('\n').length).toBe(1);
    for (const c of text) {
      const code = c.charCodeAt(0);
      expect(code).toBeGreaterThanOrEqual(63);
      expect(code).toBeLessThanOrEqual(126);
    }
  });

  it('n=62 fits in single-byte encoding (boundary)', () => {
    const data = { n: 62, edges: [] };
    const text = toG6(data).trim();
    // first char should be 62+63=125
    expect(text.charCodeAt(0)).toBe(125);
    const rt = fromG6(text);
    expect(rt.n).toBe(62);
  });

  it('n=63 uses four-byte encoding (boundary)', () => {
    const data = { n: 63, edges: [] };
    const text = toG6(data).trim();
    // first char should be 126 (~)
    expect(text.charCodeAt(0)).toBe(126);
    const rt = fromG6(text);
    expect(rt.n).toBe(63);
  });

  it('n=100 multi-byte encoding round-trips', () => {
    const data = { n: 100, edges: [[0,1],[1,2],[50,99]] };
    const rt = fromG6(toG6(data));
    expect(sameTopology(rt, data)).toBe(true);
  });

  it('complete graph K4 has 6 edges after round-trip', () => {
    const k4 = { n: 4, edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] };
    const rt = fromG6(toG6(k4));
    expect(rt.n).toBe(4);
    expect(rt.edges.length).toBe(6);
    expect(sameTopology(rt, k4)).toBe(true);
  });

  it('known K4 encoding is "C~" (McKay reference)', () => {
    // K4: n=4 → byte 4+63=67='C'; upper tri all 1s → bits=111111 → 63+63=126='~'
    const k4 = { n: 4, edges: [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]] };
    expect(toG6(k4).trim()).toBe('C~');
  });

  it('known empty on 4 vertices is "C?" (McKay reference)', () => {
    // n=4 → 'C'; no edges → 000000 → 0+63=63='?'
    const data = { n: 4, edges: [] };
    expect(toG6(data).trim()).toBe('C?');
  });

  it('strips >>graph6<< header on load', () => {
    const text = '>>graph6<<' + toG6(triangle).trim();
    const rt = fromG6(text);
    expect(sameTopology(rt, triangle)).toBe(true);
  });

  it('throws on sparse6 input', () => {
    expect(() => fromG6(':Foo')).toThrow();
  });

  it('throws for n > 258047', () => {
    expect(() => toG6({ n: 258048, edges: [] })).toThrow();
  });

  it('positions are not preserved (topology only)', () => {
    const rt = fromG6(toG6(triangle));
    expect(rt.vertices).toBeUndefined();
  });

  it('serialize/deserialize dispatch', () => {
    const text = serialize(noPos, 'g6');
    const rt = deserialize(text, 'graph.g6');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('auto-detect by >>graph6<< header', () => {
    const text = '>>graph6<<' + toG6(noPos).trim();
    const rt = deserialize(text);
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('auto-detect by .graph6 extension', () => {
    const text = toG6(noPos);
    const rt = deserialize(text, 'graph.graph6');
    expect(sameTopology(rt, noPos)).toBe(true);
  });
});

// ── serialize dispatch ────────────────────────────────────────────────────────

describe('serialize', () => {
  it('throws on unknown format', () => {
    expect(() => serialize(noPos, 'xyz')).toThrow();
  });

  it('returns string for all known formats', () => {
    for (const fmt of FORMATS) {
      expect(typeof serialize(noPos, fmt.id)).toBe('string');
    }
  });
});

// ── deserialize auto-detection ────────────────────────────────────────────────

describe('deserialize auto-detect', () => {
  it('detects JSON by content', () => {
    const text = toJSON(noPos);
    const rt = deserialize(text);
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects GraphML by content', () => {
    const text = toGraphML(noPos);
    const rt = deserialize(text);
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects GML by content', () => {
    const text = toGML(noPos);
    const rt = deserialize(text);
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects DOT by content', () => {
    const text = toDOT(noPos);
    const rt = deserialize(text);
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects JSON by .json extension', () => {
    const rt = deserialize(toJSON(noPos), 'foo.json');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects GraphML by .graphml extension', () => {
    const rt = deserialize(toGraphML(noPos), 'foo.graphml');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects GML by .gml extension', () => {
    const rt = deserialize(toGML(noPos), 'foo.gml');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects DOT by .dot extension', () => {
    const rt = deserialize(toDOT(noPos), 'foo.dot');
    expect(sameTopology(rt, noPos)).toBe(true);
  });

  it('detects CSV by .csv extension', () => {
    const rt = deserialize(toCSV(noPos), 'foo.csv');
    expect(sameTopology(rt, noPos)).toBe(true);
  });
});

// ── edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('fromJSON throws on invalid JSON', () => {
    expect(() => fromJSON('not json')).toThrow();
  });

  it('fromJSON throws when missing n', () => {
    expect(() => fromJSON('{"edges":[]}')).toThrow();
  });

  it('fromJSON throws when missing edges', () => {
    expect(() => fromJSON('{"n":3}')).toThrow();
  });

  it('large graph serializes to JSON', () => {
    const n = 100;
    const edges = Array.from({length: n-1}, (_,i) => [i, i+1]);
    const data = { n, edges };
    const text = toJSON(data);
    const rt = fromJSON(text);
    expect(rt.n).toBe(n);
    expect(rt.edges.length).toBe(n-1);
  });

  it('CSV tolerates blank lines', () => {
    const raw = '# vertices: 3\n0,1\n\n1,2\n';
    const rt = fromCSV(raw);
    expect(rt.edges.length).toBe(2);
  });

  it('DOT strips line comments', () => {
    const raw = 'graph G {\n  // comment\n  0 -- 1;\n  1 -- 2;\n}';
    const rt = fromDOT(raw);
    expect(rt.edges.length).toBe(2);
  });

  it('DOT handles block comments', () => {
    const raw = 'graph G {\n  /* block */\n  0 -- 1;\n}';
    const rt = fromDOT(raw);
    expect(rt.edges.length).toBe(1);
  });

  it('GML handles non-zero-based node ids', () => {
    const gml = 'graph [\n  node [ id 5 ]\n  node [ id 10 ]\n  edge [ source 5 target 10 ]\n]';
    const rt = fromGML(gml);
    expect(rt.n).toBe(2);
    expect(rt.edges.length).toBe(1);
  });
});
