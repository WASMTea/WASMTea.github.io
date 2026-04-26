export const FORMATS = [
  { id: 'json',    label: 'JSON (.json)',           ext: '.json',    mime: 'application/json' },
  { id: 'graphml', label: 'GraphML (.graphml)',      ext: '.graphml', mime: 'application/xml'  },
  { id: 'gml',     label: 'GML (.gml)',              ext: '.gml',     mime: 'text/plain'       },
  { id: 'dot',     label: 'DOT / Graphviz (.dot)',   ext: '.dot',     mime: 'text/plain'       },
  { id: 'csv',     label: 'CSV edge list (.csv)',    ext: '.csv',     mime: 'text/csv'         },
];

// ── serializers ───────────────────────────────────────────────────────────────

export function toJSON(data) {
  return JSON.stringify(data, null, 2);
}

export function toGraphML(data) {
  const { n, edges, vertices } = data;
  const hasPos = vertices?.some(v => v.x != null);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/graphml">',
  ];
  if (hasPos) {
    lines.push('  <key id="d0" for="node" attr.name="x" attr.type="double"/>');
    lines.push('  <key id="d1" for="node" attr.name="y" attr.type="double"/>');
  }
  if (vertices?.some(v => v.label != null)) {
    lines.push('  <key id="d2" for="node" attr.name="label" attr.type="string"/>');
  }
  lines.push('  <graph id="G" edgedefault="undirected">');
  for (let i = 0; i < n; i++) {
    const v = vertices?.[i];
    if (hasPos || v?.label != null) {
      lines.push(`    <node id="n${i}">`);
      if (hasPos && v?.x != null) lines.push(`      <data key="d0">${v.x}</data>`);
      if (hasPos && v?.y != null) lines.push(`      <data key="d1">${v.y}</data>`);
      if (v?.label != null)        lines.push(`      <data key="d2">${escXml(v.label)}</data>`);
      lines.push('    </node>');
    } else {
      lines.push(`    <node id="n${i}"/>`);
    }
  }
  let eid = 0;
  edges.forEach(([u, v]) => {
    lines.push(`    <edge id="e${eid++}" source="n${u}" target="n${v}"/>`);
  });
  lines.push('  </graph>', '</graphml>');
  return lines.join('\n');
}

function escXml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function toGML(data) {
  const { n, edges, vertices } = data;
  const lines = ['graph [', '  directed 0'];
  for (let i = 0; i < n; i++) {
    const v = vertices?.[i];
    lines.push('  node [', `    id ${i}`);
    if (v?.label != null) lines.push(`    label "${v.label}"`);
    if (v?.x != null)     lines.push(`    x ${v.x}`);
    if (v?.y != null)     lines.push(`    y ${v.y}`);
    lines.push('  ]');
  }
  edges.forEach(([u, v]) => {
    lines.push('  edge [', `    source ${u}`, `    target ${v}`, '  ]');
  });
  lines.push(']');
  return lines.join('\n');
}

export function toDOT(data, name = 'G') {
  const { n, edges } = data;
  const lines = [`graph ${name} {`];
  for (let i = 0; i < n; i++) lines.push(`  ${i};`);
  edges.forEach(([u, v]) => lines.push(`  ${u} -- ${v};`));
  lines.push('}');
  return lines.join('\n');
}

export function toCSV(data) {
  const { n, edges } = data;
  const lines = [`# vertices: ${n}`, '# source,target'];
  edges.forEach(([u, v]) => lines.push(`${u},${v}`));
  return lines.join('\n');
}

export function serialize(data, fmtId) {
  switch (fmtId) {
    case 'json':    return toJSON(data);
    case 'graphml': return toGraphML(data);
    case 'gml':     return toGML(data);
    case 'dot':     return toDOT(data);
    case 'csv':     return toCSV(data);
    default: throw new Error(`Unknown format: ${fmtId}`);
  }
}

// ── deserializers ─────────────────────────────────────────────────────────────

export function fromJSON(text) {
  const d = JSON.parse(text);
  if (typeof d.n !== 'number' || !Array.isArray(d.edges))
    throw new Error('Invalid JSON graph: missing n or edges');
  return d;
}

export function fromGraphML(text) {
  // Extract node ids in order
  const nodeRe = /<node\s[^>]*id="([^"]+)"/g;
  const nodes = [];
  let m;
  while ((m = nodeRe.exec(text)) !== null) nodes.push(m[1]);

  const idxOf = new Map(nodes.map((id, i) => [id, i]));

  // Extract position data per node
  const vertices = nodes.map(() => ({}));

  // Match all <node id="nX">...</node> blocks for data keys
  const nodeBlockRe = /<node\s[^>]*id="([^"]+)"(?:\s*\/>|>([\s\S]*?)<\/node>)/g;
  while ((m = nodeBlockRe.exec(text)) !== null) {
    const nid = m[1];
    const body = m[2] || '';
    const idx = idxOf.get(nid);
    if (idx === undefined) continue;
    const x = /<data\s[^>]*key="d0"[^>]*>([\s\S]*?)<\/data>/.exec(body);
    const y = /<data\s[^>]*key="d1"[^>]*>([\s\S]*?)<\/data>/.exec(body);
    const lbl = /<data\s[^>]*key="d2"[^>]*>([\s\S]*?)<\/data>/.exec(body);
    if (x) vertices[idx].x = parseFloat(x[1]);
    if (y) vertices[idx].y = parseFloat(y[1]);
    if (lbl) vertices[idx].label = lbl[1].trim();
  }

  // Also try key attr.name mapping for non-d0/d1 keys
  const keyX = /<key\s[^>]*id="([^"]+)"[^>]*attr\.name="x"/.exec(text);
  const keyY = /<key\s[^>]*id="([^"]+)"[^>]*attr\.name="y"/.exec(text);
  if (keyX && keyX[1] !== 'd0') {
    const kx = keyX[1];
    const nodeBlockRe2 = /<node\s[^>]*id="([^"]+)"(?:\s*\/>|>([\s\S]*?)<\/node>)/g;
    while ((m = nodeBlockRe2.exec(text)) !== null) {
      const idx = idxOf.get(m[1]);
      if (idx === undefined) continue;
      const xm = new RegExp(`<data\\s[^>]*key="${kx}"[^>]*>([\\s\\S]*?)<\\/data>`).exec(m[2] || '');
      if (xm) vertices[idx].x = parseFloat(xm[1]);
    }
  }
  if (keyY && keyY[1] !== 'd1') {
    const ky = keyY[1];
    const nodeBlockRe3 = /<node\s[^>]*id="([^"]+)"(?:\s*\/>|>([\s\S]*?)<\/node>)/g;
    while ((m = nodeBlockRe3.exec(text)) !== null) {
      const idx = idxOf.get(m[1]);
      if (idx === undefined) continue;
      const ym = new RegExp(`<data\\s[^>]*key="${ky}"[^>]*>([\\s\\S]*?)<\\/data>`).exec(m[2] || '');
      if (ym) vertices[idx].y = parseFloat(ym[1]);
    }
  }

  // Extract edges
  const edgeRe = /<edge\s[^>]*source="([^"]+)"[^>]*target="([^"]+)"/g;
  const edges = [];
  while ((m = edgeRe.exec(text)) !== null) {
    const u = idxOf.get(m[1]), v = idxOf.get(m[2]);
    if (u !== undefined && v !== undefined) edges.push([u, v]);
  }

  const hasPos = vertices.some(v => v.x != null);
  return { n: nodes.length, edges, vertices: hasPos ? vertices : undefined };
}

export function fromGML(text) {
  // Tokenise: extract node and edge blocks
  const nodes = [];
  const edgesRaw = [];

  // Find balanced [ ] blocks after 'node' and 'edge' keywords
  function extractBlocks(keyword, src) {
    const blocks = [];
    const re = new RegExp(`\\b${keyword}\\s*\\[`, 'g');
    let m;
    while ((m = re.exec(src)) !== null) {
      let depth = 1, i = m.index + m[0].length;
      while (i < src.length && depth > 0) {
        if (src[i] === '[') depth++;
        else if (src[i] === ']') depth--;
        i++;
      }
      blocks.push(src.slice(m.index + m[0].length, i - 1));
    }
    return blocks;
  }

  extractBlocks('node', text).forEach(block => {
    const idM  = /\bid\s+(-?\d+)/.exec(block);
    const xM   = /\bx\s+(-?[\d.eE+]+)/.exec(block);
    const yM   = /\by\s+(-?[\d.eE+]+)/.exec(block);
    const lblM = /\blabel\s+"([^"]*)"/.exec(block);
    if (!idM) return;
    nodes.push({
      id: parseInt(idM[1]),
      x: xM  ? parseFloat(xM[1])  : undefined,
      y: yM  ? parseFloat(yM[1])  : undefined,
      label: lblM ? lblM[1] : undefined,
    });
  });

  extractBlocks('edge', text).forEach(block => {
    const sM = /\bsource\s+(-?\d+)/.exec(block);
    const tM = /\btarget\s+(-?\d+)/.exec(block);
    if (sM && tM) edgesRaw.push([parseInt(sM[1]), parseInt(tM[1])]);
  });

  // Build contiguous index
  nodes.sort((a, b) => a.id - b.id);
  const idxOf = new Map(nodes.map((nd, i) => [nd.id, i]));
  const hasPos = nodes.some(nd => nd.x != null);
  const vertices = hasPos ? nodes.map(nd => ({
    x: nd.x, y: nd.y, label: nd.label,
  })) : undefined;
  const edges = edgesRaw
    .map(([s, t]) => [idxOf.get(s), idxOf.get(t)])
    .filter(([u, v]) => u !== undefined && v !== undefined);

  return { n: nodes.length, edges, vertices };
}

export function fromDOT(text) {
  // Strip comments
  const src = text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  const nodeSet = new Set();
  const edgePairs = [];

  // Edges:  a -- b  or  a -> b
  const edgeRe = /(\w+)\s*(?:--|->)\s*(\w+)/g;
  let m;
  while ((m = edgeRe.exec(src)) !== null) {
    nodeSet.add(m[1]); nodeSet.add(m[2]);
    edgePairs.push([m[1], m[2]]);
  }

  // Standalone node declarations (not part of an edge)
  const stmtRe = /^\s*(\w+)\s*[;\[]/gm;
  while ((m = stmtRe.exec(src)) !== null) {
    const tok = m[1];
    if (!['graph','digraph','strict','node','edge','subgraph'].includes(tok))
      nodeSet.add(tok);
  }

  const nodes = [...nodeSet];
  nodes.sort((a, b) => {
    // sort numerically if possible
    const na = parseInt(a), nb = parseInt(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  const idxOf = new Map(nodes.map((id, i) => [id, i]));
  const edges = edgePairs.map(([a, b]) => [idxOf.get(a), idxOf.get(b)]);
  return { n: nodes.length, edges };
}

export function fromCSV(text) {
  const lines = text.split(/\r?\n/);
  let n = 0;
  const edges = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      // Parse "# vertices: N" header if present
      const vm = /vertices:\s*(\d+)/i.exec(line);
      if (vm) n = parseInt(vm[1]);
      continue;
    }
    const parts = line.split(/[\s,;]+/);
    if (parts.length >= 2) {
      const u = parseInt(parts[0]), v = parseInt(parts[1]);
      if (!isNaN(u) && !isNaN(v)) {
        edges.push([u, v]);
        n = Math.max(n, u + 1, v + 1);
      }
    }
  }

  return { n, edges };
}

// Auto-detect format from content / filename
export function deserialize(text, filename = '') {
  const name = filename.toLowerCase();
  if (name.endsWith('.json'))    return fromJSON(text);
  if (name.endsWith('.graphml')) return fromGraphML(text);
  if (name.endsWith('.gml'))     return fromGML(text);
  if (name.endsWith('.dot') || name.endsWith('.gv')) return fromDOT(text);
  if (name.endsWith('.csv'))     return fromCSV(text);

  // Sniff content
  const t = text.trimStart();
  if (t.startsWith('{'))         return fromJSON(text);
  if (t.startsWith('<'))         return fromGraphML(text);
  if (/^graph\s*\[/m.test(t))    return fromGML(text);
  if (/^(?:strict\s+)?(?:di)?graph\b/i.test(t)) return fromDOT(text);
  return fromCSV(text);
}

// ── download helper ───────────────────────────────────────────────────────────

export function triggerDownload(text, filename, mime) {
  const blob = new Blob([text], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
