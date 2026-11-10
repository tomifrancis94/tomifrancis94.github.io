// Rendering for the Test 2 practice quiz. The parsing functions are pure (usable in Node);
// the DOM functions need a browser and KaTeX (window.katex, from ../mcq/vendor/katex/).
// Same logic as MCQ Studio's renderMathText / inlineRich / renderRich / tableNode.

export const KATEX_OPTIONS = {throwOnError: true, trust: false, strict: 'error', output: 'htmlAndMathml'};

// Split text into plain and maths segments. Maths is \( ... \) (inline) or \[ ... \] (display);
// outside maths, "a/b" with digits becomes a fraction and Cr_X, Pr_X, EU_X become operator names.
export function mathSegments(value) {
  const source = String(value ?? ''), out = [];
  if (/^-?\d+\s*\/\s*\d+$/.test(source.trim())) {
    const [a, b] = source.split('/');
    return [{math: true, tex: String.raw`\dfrac{${a}}{${b}}`, display: false}];
  }
  const plain = text => {
    for (const part of String(text).split(/(-?\d+\/\d+|\b(?:Cr|Pr|EU)_[A-Za-z]\b)/g)) {
      if (!part) continue;
      if (/^-?\d+\/\d+$/.test(part)) { const [a, b] = part.split('/'); out.push({math: true, tex: String.raw`\dfrac{${a}}{${b}}`, display: false}); }
      else if (/^(Cr|Pr|EU)_/.test(part)) { const [name, sub] = part.split('_'); out.push({math: true, tex: String.raw`\operatorname{${name}}_{${sub}}`, display: false}); }
      else out.push({math: false, text: part});
    }
  };
  const pattern = /\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
  let match, last = 0;
  while ((match = pattern.exec(source))) {
    plain(source.slice(last, match.index));
    out.push({math: true, tex: match[1] ?? match[2], display: match[2] !== undefined});
    last = pattern.lastIndex;
  }
  plain(source.slice(last));
  return out;
}

// **bold** and *em* outside maths.
export function inlineParts(value) {
  return String(value).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map(part =>
    /^\*\*[^*]+\*\*$/.test(part) ? {style: 'strong', text: part.slice(2, -2)}
    : /^\*[^*]+\*$/.test(part) ? {style: 'em', text: part.slice(1, -1)}
    : {style: null, text: part});
}

// Rich stems: one block per line; "**Name**: statement" is a principle box; "[[table]]" places the table.
export function richBlocks(stem) {
  return String(stem).split('\n').map(line => {
    if (line === '[[table]]') return {kind: 'table'};
    const p = line.match(/^\*\*(.+?)\*\*:\s*(.*)$/);
    if (p) return {kind: 'principle', name: p[1], text: p[2]};
    return {kind: line.trim() ? 'line' : 'gap', text: line};
  });
}

// Every piece of text the quiz renders for an item, for checking (e.g. KaTeX in Node).
export function itemTexts(item) {
  const texts = [];
  if (item.format === 'rich') {
    for (const b of richBlocks(item.stem)) {
      if (b.kind === 'principle') texts.push(b.name, ...inlineParts(b.text).map(p => p.text));
      else if (b.kind !== 'table') texts.push(...inlineParts(b.text).map(p => p.text));
    }
  } else texts.push(item.stem);
  if (item.table) texts.push(...item.table.headers, ...item.table.rows.flat());
  texts.push(...item.options);
  if (item.explanation) texts.push(...inlineParts(item.explanation).map(p => p.text));
  return texts;
}

// A plain-text version for aria-labels.
const SYMBOLS = {succsim: '≿', succ: '≻', sim: '∼', times: '×', alpha: 'α', beta: 'β', gamma: 'γ', geq: '≥', leq: '≤', cdot: '·'};
export function readableText(value) {
  return String(value).replace(/\\[()[\]]/g, '')
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\\[dt]?frac(\d)(\d)/g, '$1/$2')
    .replace(/\\sqrt\{([^{}]*)\}/g, '√$1').replace(/\\(?:operatorname|mathrm|text)\{([^{}]*)\}/g, '$1')
    .replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002').replace(/\\\$/g, '$')
    .replace(/\\([A-Za-z]+)/g, (m, name) => SYMBOLS[name] ? ' ' + SYMBOLS[name] + ' ' : ' ')
    .replace(/[{}]/g, '').replace(/\u0001/g, '{').replace(/\u0002/g, '}').replace(/\\,/g, ' ')
    .replace(/\s+/g, ' ').replace(/ ([,.)])/g, '$1').replace(/\( /g, '(').trim();
}

// ---- DOM ----

export function renderMathText(node, value) {
  node.replaceChildren();
  for (const seg of mathSegments(value)) {
    if (!seg.math) { node.append(document.createTextNode(seg.text)); continue; }
    const span = document.createElement(seg.display ? 'div' : 'span');
    span.className = seg.display ? 'math-block' : 'math-inline';
    try { window.katex.render(seg.tex, span, {...KATEX_OPTIONS, displayMode: seg.display}); }
    catch (error) { span.textContent = seg.tex; console.error(error); }
    node.append(span);
  }
  return node;
}

function el(tag, value, cls) {
  const n = document.createElement(tag);
  renderMathText(n, value);
  if (cls) n.className = cls;
  return n;
}

export function renderInline(node, value) {
  for (const part of inlineParts(value)) node.append(el(part.style || 'span', part.text));
  return node;
}

export function tableNode(spec) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const t = document.createElement('table');
  t.className = 'data-table';
  const head = document.createElement('thead'), tr = document.createElement('tr');
  spec.headers.forEach(v => { const th = el('th', v); th.scope = 'col'; tr.append(th); });
  head.append(tr);
  const body = document.createElement('tbody');
  spec.rows.forEach(row => { const r = document.createElement('tr'); row.forEach(v => r.append(el('td', v))); body.append(r); });
  t.append(head, body);
  wrap.append(t);
  return wrap;
}

export function renderStem(node, item) {
  node.replaceChildren();
  if (item.format !== 'rich') {
    node.append(el('div', item.stem, 'stem-line'));
    if (item.table) node.append(tableNode(item.table));
    return node;
  }
  let placed = false;
  for (const block of richBlocks(item.stem)) {
    if (block.kind === 'table') { if (item.table) { node.append(tableNode(item.table)); placed = true; } continue; }
    if (block.kind === 'principle') {
      const box = document.createElement('div');
      box.className = 'principle';
      box.append(el('strong', block.name), document.createTextNode(': '));
      renderInline(box, block.text);
      node.append(box);
      continue;
    }
    const d = document.createElement('div');
    d.className = block.kind === 'line' ? 'stem-line' : 'stem-gap';
    renderInline(d, block.text);
    node.append(d);
  }
  if (item.table && !placed) node.append(tableNode(item.table));
  return node;
}
