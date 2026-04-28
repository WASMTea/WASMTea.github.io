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

// ── JSON output correctness ───────────────────────────────────────────────────

describe('JSON output correctness', () => {
  it('n field equals vertex count', () => {
    expect(JSON.parse(toJSON(triangle)).n).toBe(3);
    expect(JSON.parse(toJSON(star4)).n).toBe(5);
  });

  it('edges array is exact [[u,v], ...] pairs in input order', () => {
    const obj = JSON.parse(toJSON({ n: 3, edges: [[0,1],[1,2]] }));
    expect(obj.edges).toEqual([[0,1],[1,2]]);
  });

  it('vertex x and y values are preserved verbatim', () => {
    const obj = JSON.parse(toJSON(triangle));
    expect(obj.vertices[0].x).toBe(0);
    expect(obj.vertices[0].y).toBe(0);
    expect(obj.vertices[1].x).toBe(100);
    expect(obj.vertices[1].y).toBe(0);
    expect(obj.vertices[2].x).toBe(50);
    expect(obj.vertices[2].y).toBe(86);
  });

  it('vertex labels are preserved verbatim', () => {
    const obj = JSON.parse(toJSON(withLabels));
    expect(obj.vertices[0].label).toBe('A');
    expect(obj.vertices[1].label).toBe('B');
    expect(obj.vertices[2].label).toBe('C');
  });

  it('vertices key absent when not supplied', () => {
    const obj = JSON.parse(toJSON(noPos));
    expect(obj.vertices).toBeUndefined();
  });

  it('empty graph produces n=0, edges=[]', () => {
    const obj = JSON.parse(toJSON(empty));
    expect(obj.n).toBe(0);
    expect(obj.edges).toEqual([]);
  });
});

// ── GraphML output correctness ────────────────────────────────────────────────

describe('GraphML output correctness', () => {
  it('node IDs are n0, n1, n2, ...', () => {
    const text = toGraphML({ n: 3, edges: [] });
    expect(text).toContain('id="n0"');
    expect(text).toContain('id="n1"');
    expect(text).toContain('id="n2"');
  });

  it('node count in output matches n', () => {
    const text = toGraphML({ n: 5, edges: [] });
    expect((text.match(/<node[ /]/g) || []).length).toBe(5);
  });

  it('edge source and target reference correct node IDs', () => {
    const text = toGraphML({ n: 3, edges: [[0,2]] });
    expect(text).toContain('source="n0"');
    expect(text).toContain('target="n2"');
  });

  it('edge count in output matches input', () => {
    const text = toGraphML({ n: 5, edges: [[0,1],[1,2],[2,3]] });
    expect((text.match(/<edge[ /]/g) || []).length).toBe(3);
  });

  it('x coordinate written in d0 data key', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 42.5, y: 17.3 }] };
    expect(toGraphML(d)).toContain('<data key="d0">42.5</data>');
  });

  it('y coordinate written in d1 data key', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 42.5, y: 17.3 }] };
    expect(toGraphML(d)).toContain('<data key="d1">17.3</data>');
  });

  it('label written in d2 data key', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 0, y: 0, label: 'Hub' }] };
    expect(toGraphML(d)).toContain('<data key="d2">Hub</data>');
  });

  it('declares edgedefault="undirected"', () => {
    expect(toGraphML(noPos)).toContain('edgedefault="undirected"');
  });

  it('declares d0 key for x when positions present', () => {
    const text = toGraphML(triangle);
    expect(text).toContain('attr.name="x"');
  });

  it('no position keys when no vertices', () => {
    const text = toGraphML(noPos);
    expect(text).not.toContain('attr.name="x"');
    expect(text).not.toContain('attr.name="y"');
  });

  it('integer positions written without rounding', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 100, y: 200 }] };
    const text = toGraphML(d);
    expect(text).toContain('<data key="d0">100</data>');
    expect(text).toContain('<data key="d1">200</data>');
  });
});

// ── GML output correctness ────────────────────────────────────────────────────

describe('GML output correctness', () => {
  it('directed 0 marks the graph as undirected', () => {
    expect(toGML(noPos)).toContain('directed 0');
  });

  it('node id values are 0-based', () => {
    const text = toGML({ n: 3, edges: [] });
    expect(text).toContain('id 0');
    expect(text).toContain('id 1');
    expect(text).toContain('id 2');
  });

  it('node count matches n', () => {
    const text = toGML({ n: 4, edges: [] });
    expect((text.match(/\bnode\b/g) || []).length).toBe(4);
  });

  it('edge source and target match the input pair', () => {
    const text = toGML({ n: 3, edges: [[0,2]] });
    expect(text).toContain('source 0');
    expect(text).toContain('target 2');
  });

  it('edge count matches input', () => {
    const text = toGML({ n: 4, edges: [[0,1],[1,2],[2,3]] });
    expect((text.match(/\bedge\b/g) || []).length).toBe(3);
  });

  it('x and y written for positioned vertices', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 10, y: 20 }] };
    const text = toGML(d);
    expect(text).toContain('x 10');
    expect(text).toContain('y 20');
  });

  it('no x/y lines when positions absent', () => {
    const text = toGML(noPos);
    expect(text).not.toMatch(/\bx\s+[\d.]/);
    expect(text).not.toMatch(/\by\s+[\d.]/);
  });

  it('label written in double quotes', () => {
    const text = toGML(withLabels);
    expect(text).toContain('label "A"');
    expect(text).toContain('label "B"');
    expect(text).toContain('label "C"');
  });

  it('float positions written correctly', () => {
    const d = { n: 1, edges: [], vertices: [{ x: 1.5, y: 2.75 }] };
    const text = toGML(d);
    expect(text).toContain('x 1.5');
    expect(text).toContain('y 2.75');
  });
});

// ── DOT output correctness ────────────────────────────────────────────────────

describe('DOT output correctness', () => {
  it('each vertex has its own "  id;" declaration', () => {
    const text = toDOT({ n: 3, edges: [] });
    expect(text).toContain('  0;');
    expect(text).toContain('  1;');
    expect(text).toContain('  2;');
  });

  it('edge line format is "  u -- v;"', () => {
    const text = toDOT({ n: 2, edges: [[0,1]] });
    expect(text).toContain('  0 -- 1;');
  });

  it('output is wrapped in "graph Name { ... }"', () => {
    const text = toDOT({ n: 1, edges: [] });
    expect(text.trimStart()).toMatch(/^graph\s+\w+\s*\{/);
    expect(text.trimEnd()).toMatch(/\}$/);
  });

  it('default graph name is G', () => {
    expect(toDOT({ n: 1, edges: [] })).toContain('graph G {');
  });

  it('custom name appears in output', () => {
    expect(toDOT({ n: 1, edges: [] }, 'Petersen')).toContain('graph Petersen {');
  });

  it('-- edge count matches input', () => {
    const text = toDOT({ n: 5, edges: [[0,1],[1,2],[2,3],[3,4]] });
    expect((text.match(/--/g) || []).length).toBe(4);
  });

  it('no -- present for edgeless graph', () => {
    expect(toDOT(isolated)).not.toContain('--');
  });

  it('triangle has exactly three edges', () => {
    const text = toDOT(triangle);
    expect((text.match(/--/g) || []).length).toBe(3);
  });

  it('non-adjacent pair does not appear as edge', () => {
    // In path 0-1-2, edge (0,2) must not be present
    const text = toDOT({ n: 3, edges: [[0,1],[1,2]] });
    expect(text).not.toContain('0 -- 2');
    expect(text).not.toContain('2 -- 0');
  });
});

// ── CSV output correctness ────────────────────────────────────────────────────

describe('CSV output correctness', () => {
  it('edge rows are "u,v" (no spaces)', () => {
    const text = toCSV({ n: 3, edges: [[0,1],[1,2],[0,2]] });
    const rows = text.split('\n').filter(l => !l.startsWith('#') && l.trim());
    expect(rows).toContain('0,1');
    expect(rows).toContain('1,2');
    expect(rows).toContain('0,2');
  });

  it('vertex count header is exact', () => {
    expect(toCSV({ n: 7, edges: [] })).toContain('vertices: 7');
  });

  it('data row count equals edge count', () => {
    const text = toCSV({ n: 5, edges: [[0,1],[1,2],[2,3],[3,4]] });
    const rows = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    expect(rows.length).toBe(4);
  });

  it('no data rows for edgeless graph', () => {
    const text = toCSV({ n: 5, edges: [] });
    const rows = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    expect(rows.length).toBe(0);
  });

  it('edges appear in input order', () => {
    const edges = [[2,3],[0,1],[1,4]];
    const text = toCSV({ n: 5, edges });
    const rows = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    expect(rows[0]).toBe('2,3');
    expect(rows[1]).toBe('0,1');
    expect(rows[2]).toBe('1,4');
  });
});

// ── Graph6 additional reference values ───────────────────────────────────────
// All reference encodings verified against McKay's graph6 specification.
// Each character c encodes a 6-bit value c.charCodeAt(0)−63.

describe('Graph6 output correctness', () => {
  it('n=0 (empty graph) → "?"', () => {
    // n=0: byte 0+63=63='?'. No adjacency bits.
    expect(toG6(empty).trim()).toBe('?');
  });

  it('n=1 (single vertex) → "@"', () => {
    // n=1: byte 1+63=64='@'. No pairs, no bits.
    expect(toG6(single).trim()).toBe('@');
  });

  it('n=2 no edge → "A?"', () => {
    // n=2: 'A'. Bit (0,1)=0 → padded 000000=0+63=63='?'.
    expect(toG6({ n: 2, edges: [] }).trim()).toBe('A?');
  });

  it('n=2 one edge → "A_"', () => {
    // n=2: 'A'. Bit (0,1)=1 → padded 100000=32+63=95='_'.
    expect(toG6({ n: 2, edges: [[0,1]] }).trim()).toBe('A_');
  });

  it('P3 (path on 3 vertices, edges 0-1, 1-2) → "Bg"', () => {
    // n=3: 'B'. Bits: (0,1)=1,(0,2)=0,(1,2)=1 → padded 101000=40+63=103='g'.
    expect(toG6({ n: 3, edges: [[0,1],[1,2]] }).trim()).toBe('Bg');
  });

  it('K3 (triangle) → "Bw"', () => {
    // n=3: 'B'. Bits: all 1 → 111000=56+63=119='w'.
    expect(toG6({ n: 3, edges: [[0,1],[0,2],[1,2]] }).trim()).toBe('Bw');
  });

  it('P4 (path on 4 vertices) → "Ch"', () => {
    // n=4: 'C'. Bits: (0,1)=1,(0,2)=0,(1,2)=1,(0,3)=0,(1,3)=0,(2,3)=1
    // → 101001=41+63=104='h'.
    expect(toG6({ n: 4, edges: [[0,1],[1,2],[2,3]] }).trim()).toBe('Ch');
  });

  it('C4 (4-cycle, edges 0-1,1-2,2-3,0-3) → "Cl"', () => {
    // Bits: (0,1)=1,(0,2)=0,(1,2)=1,(0,3)=1,(1,3)=0,(2,3)=1 → 101101=45+63=108='l'.
    expect(toG6({ n: 4, edges: [[0,1],[1,2],[2,3],[0,3]] }).trim()).toBe('Cl');
  });

  it('K_{1,3} star (center=0, edges 0-1,0-2,0-3) → "Cs"', () => {
    // Bits: (0,1)=1,(0,2)=1,(1,2)=0,(0,3)=1,(1,3)=0,(2,3)=0 → 110100=52+63=115='s'.
    expect(toG6({ n: 4, edges: [[0,1],[0,2],[0,3]] }).trim()).toBe('Cs');
  });

  it('adjacency bit order is upper-triangle column-by-column (j>i)', () => {
    // For n=3, pair order is (0,1),(0,2),(1,2).
    // Only edge (0,2): bits 0,1,0 → padded 010000=16+63=79='O' (uppercase).
    expect(toG6({ n: 3, edges: [[0,2]] }).trim()).toBe('BO');
  });

  it('bit length is ceil(n*(n-1)/2 / 6) * 6 rounded up', () => {
    // n=5: 10 pairs → 12 bits → 2 data bytes.
    const text = toG6({ n: 5, edges: [] }).trim();
    expect(text.length).toBe(3); // 1 byte for n + 2 data bytes
  });

  it('K5 (complete on 5) has all-1 upper triangle', () => {
    // n=5: 'D'. 10 bits all 1 → padded 12 bits: 111111=63+63=126='~', 110000=48+63=111='o'.
    const k5edges = [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]];
    expect(toG6({ n: 5, edges: k5edges }).trim()).toBe('D~{');
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
