// 神经图谱数据：全部由 src/data/sample.js 的资料在浏览器中推导，不读取任何外部仓库。
// 连接来源：笔记正文 [[双链]]、目录归属、选题转草稿记录、作品话题标签、正文提及的概念词，
// 以及两篇内容共同提及 ≥2 个概念时形成的「双向共振」。
import {posts, workContent} from './works';
import {notes as notesRaw, concepts as CONCEPTS} from '../data';
import {CONFIG} from '../config';
import {T} from './theme';

export const KINDS = {
  core: {label: '创作空间', en: 'Core', color: T.kinds.core},
  folder: {label: '目录', en: 'Folder', color: T.kinds.folder},
  post: {label: '作品', en: 'Work', color: T.kinds.post},
  note: {label: '方法笔记', en: 'Method note', color: T.kinds.note},
  idea: {label: '选题', en: 'Idea', color: T.kinds.idea},
  draft: {label: '草稿', en: 'Draft', color: T.kinds.draft},
  concept: {label: '概念', en: 'Concept', color: T.kinds.concept},
  tag: {label: '话题', en: 'Topic', color: T.kinds.tag},
  ghost: {label: '未创建', en: 'Unresolved', color: T.kinds.ghost}
};
export const LINK_KINDS = {
  contain: '目录归属',
  wiki: '[[双链]]',
  source: '选题来源',
  tag: '话题标签',
  mention: '正文提及',
  resonance: '双向共振'
};
export const LINK_EN = {contain: 'Contains', wiki: 'Wikilink', source: 'Source', tag: 'Topic', mention: 'Mention', resonance: 'Resonance'};
export const CONTENT = new Set(['post', 'note', 'idea', 'draft']);

const FOLDERS = [
  {id: 'f:works', title: '作品库', path: '02-作品库', angle: 180},
  {id: 'f:drafts', title: '创作台', path: '03-创作台', angle: 145},
  {id: 'f:ideas', title: '选题池', path: '04-选题池', angle: 35},
  {id: 'f:methods', title: '方法库', path: '05-方法库 methods', angle: 0}
];

// 首页围绕光球的五个模块；角度与图谱布局的目录锚点一致，背景网络会朝各自模块蔓延。
export const MODULES = [
  {id: 'works', title: '作品库', en: 'Works', kind: 'post', folder: 'f:works', angle: 180, icon: 'works', page: 'library'},
  {id: 'concepts', title: '概念网络', en: 'Concepts', kind: 'concept', angle: -90, icon: 'concept'},
  {id: 'methods', title: '方法库', en: 'Methods', kind: 'note', folder: 'f:methods', angle: 0, icon: 'methods'},
  {id: 'ideas', title: '选题池', en: 'Ideas', kind: 'idea', folder: 'f:ideas', angle: 35, icon: 'idea', page: 'ideas'},
  {id: 'drafts', title: '创作台', en: 'Drafts', kind: 'draft', folder: 'f:drafts', angle: 145, icon: 'draft', page: 'drafts'}
];
export const moduleOf = node => MODULES.find(m => m.kind === node?.kind) || null;

export const cleanTitle = t => String(t || '').replace(/^\d+[A-Z]?-☑️/, '').replace(/^\d+-/, '').replace(/_/g, ' · ');
const contentOf = id => workContent.find(c => c.title === posts.find(p => p.id === id)?.title);
export const postMedia = post => contentOf(post.id) || null;

export function buildGraph({ideas = [], drafts = []} = {}) {
  const nodes = new Map();
  const add = n => { if (!nodes.has(n.id)) nodes.set(n.id, {tags: [], text: '', ...n}); return nodes.get(n.id); };
  const edges = new Map();
  const link = (s, t, kind, w = 1) => {
    if (!nodes.has(s) || !nodes.has(t) || s === t) return;
    const [a, b] = s < t ? [s, t] : [t, s];
    const key = a + '|' + b + '|' + kind;
    const e = edges.get(key) || {a, b, kind, ab: 0, ba: 0, w: 0};
    if (s === a) e.ab += 1; else e.ba += 1;
    e.w = Math.max(e.w, w);
    edges.set(key, e);
  };

  add({id: 'core', kind: 'core', title: CONFIG.workspace, path: '/', text: ''});
  for (const f of FOLDERS) { add({...f, kind: 'folder'}); link('core', f.id, 'contain'); }

  // 作品：指标、正文和话题。
  for (const p of posts) {
    const c = contentOf(p.id);
    add({id: 'post:' + p.id, kind: 'post', title: p.title, short: p.title.replace(/^Obsidian[：:]/, ''), path: '02-作品库/' + p.title, folder: 'f:works', text: p.title + '\n' + (c?.body || ''), body: c?.body || '', date: p.date, post: p, media: c?.media, cover: c?.cover, tags: c?.tags || []});
    link('f:works', 'post:' + p.id, 'contain');
  }

  // 方法库笔记与子目录。
  for (const n of notesRaw) {
    const parts = n.path.split('/');
    const sub = parts[1];
    const subId = 'f:' + sub;
    add({id: subId, kind: 'folder', title: sub.replace(/^\d+-/, '').replace(/\s+[a-z-]+$/i, ''), path: parts.slice(0, 2).join('/'), level: 2});
    link('f:methods', subId, 'contain');
    const id = 'note:' + n.id;
    add({id, kind: 'note', title: n.title, short: cleanTitle(n.title), path: n.path, folder: subId, text: n.title + '\n' + n.body, body: n.body});
    link(subId, id, 'contain');
  }

  for (const i of ideas) {
    add({id: 'idea:' + i.id, kind: 'idea', title: i.title || '未命名选题', short: i.title, path: '04-选题池/' + i.title, folder: 'f:ideas', text: i.title + '\n' + (i.note || ''), idea: i});
    link('f:ideas', 'idea:' + i.id, 'contain');
  }
  for (const d of drafts) {
    add({id: 'draft:' + d.id, kind: 'draft', title: d.title || '未命名草稿', short: d.title, path: '03-创作台/正在写/' + d.title, folder: 'f:drafts', text: d.title + '\n' + (d.body || ''), body: d.body || '', draft: d});
    link('f:drafts', 'draft:' + d.id, 'contain');
  }

  // 选题 ⇄ 草稿：草稿记录来源选题；选题状态为「已转草稿」时反向也成立。
  for (const d of drafts) {
    if (d.source == null) continue;
    const idea = ideas.find(i => i.id === d.source);
    if (!idea) continue;
    link('draft:' + d.id, 'idea:' + idea.id, 'source');
    if (idea.status === '已转草稿') link('idea:' + idea.id, 'draft:' + d.id, 'source');
  }

  // [[双链]]：方法库笔记与草稿正文。能对应到现有内容即为实链，否则是「未创建」笔记。
  const byName = new Map();
  for (const n of nodes.values()) if (CONTENT.has(n.kind)) {
    byName.set(String(n.title).toLowerCase(), n.id);
    if (n.path) byName.set(n.path.split('/').pop().replace(/\.md$/, '').toLowerCase(), n.id);
  }
  for (const n of [...nodes.values()]) {
    if (n.kind !== 'note' && n.kind !== 'draft') continue;
    for (const m of (n.body || '').matchAll(/\[\[([^\]]+)\]\]/g)) {
      const [target, alias] = m[1].split('|');
      if (target.includes('{{')) continue;
      const name = target.split('#')[0].split('/').pop().trim();
      if (!name) continue;
      let id = byName.get(name.toLowerCase());
      if (!id) {
        id = 'ghost:' + name.toLowerCase();
        add({id, kind: 'ghost', title: alias?.trim() || name, short: alias?.trim() || cleanTitle(name), path: target.trim() + '.md', text: ''});
      }
      link(n.id, id, 'wiki');
    }
  }

  // 话题标签（大小写合并）。
  for (const n of [...nodes.values()]) for (const tag of n.tags || []) {
    const id = 'tag:' + tag.toLowerCase();
    add({id, kind: 'tag', title: '#' + tag, short: '#' + tag, text: ''});
    link(n.id, id, 'tag');
  }

  // 概念提及 + 双向共振（概念词表见 src/data/sample.js）。
  const content = [...nodes.values()].filter(n => CONTENT.has(n.kind));
  const mentions = new Map();
  for (const [name, terms] of CONCEPTS) {
    const hits = content.filter(n => terms.some(t => n.text.toLowerCase().includes(t)));
    if (hits.length < 2) continue;
    const id = 'concept:' + name;
    add({id, kind: 'concept', title: name, short: name, text: '', terms});
    for (const h of hits) { link(h.id, id, 'mention'); mentions.set(h.id, [...(mentions.get(h.id) || []), name]); }
  }
  for (let i = 0; i < content.length; i++) for (let j = i + 1; j < content.length; j++) {
    const A = mentions.get(content[i].id) || [], B = mentions.get(content[j].id) || [];
    const shared = A.filter(x => B.includes(x));
    if (shared.length >= 2) { link(content[i].id, content[j].id, 'resonance', shared.length); link(content[j].id, content[i].id, 'resonance', shared.length); }
  }

  const list = [...nodes.values()];
  const links = [...edges.values()].map(e => ({...e, both: e.ab > 0 && e.ba > 0, s: e.ab ? e.a : e.b, t: e.ab ? e.b : e.a}));
  for (const n of list) { n.out = 0; n.in = 0; n.deg = 0; n.mutual = 0; }
  const idx = new Map(list.map(n => [n.id, n]));
  for (const l of links) {
    const A = idx.get(l.a), B = idx.get(l.b);
    if (l.kind === 'contain') continue;
    A.deg++; B.deg++;
    if (l.both) { A.mutual++; B.mutual++; A.out++; B.out++; A.in++; B.in++; }
    else { idx.get(l.s).out++; idx.get(l.t).in++; }
  }
  for (const n of list) n.shared = mentions.get(n.id) || [];
  return {nodes: list, links, index: idx};
}

// 同一对内容之间可能同时有多种连接（如互相双链 + 双向共振），每个对象只保留一条：双向优先，其次权重高的。
export function neighbors(graph, id) {
  const best = new Map();
  const rank = x => (x.dir === 'mutual' ? 100 : 0) + x.link.w;
  for (const l of graph.links) {
    if ((l.a !== id && l.b !== id) || l.kind === 'contain') continue;
    const other = l.a === id ? l.b : l.a;
    const item = {id: other, link: l, dir: l.both ? 'mutual' : l.s === id ? 'out' : 'back'};
    const prev = best.get(other);
    if (!prev || rank(item) > rank(prev)) best.set(other, item);
  }
  const lists = {out: [], back: [], mutual: []};
  for (const x of best.values()) lists[x.dir].push({id: x.id, link: x.link});
  return lists;
}

// 二度关联：没有直接相连，但共享概念或话题的内容。
export function latent(graph, id) {
  const near = new Set([id, ...graph.links.filter(l => l.a === id || l.b === id).map(l => l.a === id ? l.b : l.a)]);
  const hubs = graph.links.filter(l => (l.a === id || l.b === id) && (l.kind === 'mention' || l.kind === 'tag')).map(l => l.a === id ? l.b : l.a);
  const score = new Map();
  for (const h of hubs) for (const l of graph.links) {
    if (l.a !== h && l.b !== h) continue;
    const other = l.a === h ? l.b : l.a;
    if (near.has(other) || !CONTENT.has(graph.index.get(other)?.kind)) continue;
    score.set(other, [...(score.get(other) || []), graph.index.get(h).title]);
  }
  return [...score].sort((a, b) => b[1].length - a[1].length).map(([other, via]) => ({id: other, via}));
}

export function stats(graph) {
  const content = graph.nodes.filter(n => CONTENT.has(n.kind));
  const real = graph.links.filter(l => l.kind !== 'contain');
  return {
    content: content.length,
    links: real.length,
    mutual: real.filter(l => l.both).length,
    wiki: graph.links.filter(l => l.kind === 'wiki').length,
    ghosts: graph.nodes.filter(n => n.kind === 'ghost').length,
    lonely: content.filter(n => !real.some(l => l.a === n.id || l.b === n.id)).length,
    backlinked: content.filter(n => n.in > 0).length
  };
}

// —— 布局 ——
function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const rad = d => d * Math.PI / 180;

export function forceLayout(graph) {
  const N = graph.nodes, idx = graph.index;
  const anchor = id => {
    const n = idx.get(id);
    if (n.kind === 'concept') return [0, -1];
    const f = FOLDERS.find(f => f.id === (n.folder?.startsWith('f:0') || n.level === 2 ? 'f:methods' : n.folder) || f.id === id);
    return f ? [Math.cos(rad(f.angle)), Math.sin(rad(f.angle))] : null;
  };
  for (const n of N) {
    const r = rng(n.id), a = anchor(n.id);
    const R = n.kind === 'core' ? 0 : n.kind === 'folder' ? (n.level ? 300 : 210) : CONTENT.has(n.kind) ? 330 : 420;
    const base = a ? Math.atan2(a[1], a[0]) : r() * Math.PI * 2;
    const ang = base + (r() - .5) * (a ? 1.1 : 6.28);
    n.x = Math.cos(ang) * R * (0.8 + r() * .4); n.y = Math.sin(ang) * R * (0.8 + r() * .4); n.vx = 0; n.vy = 0;
  }
  const rest = {contain: 120, wiki: 95, source: 90, tag: 52, mention: 135, resonance: 170};
  const strength = {contain: .05, wiki: .06, source: .08, tag: .09, mention: .018, resonance: .006};
  for (let it = 0; it < 520; it++) {
    const alpha = 1 - it / 520;
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const A = N[i], B = N[j];
      let dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy || .01;
      const charge = (A.kind === 'tag' || B.kind === 'tag' ? 900 : 2600) * (A.kind === 'folder' && B.kind === 'folder' ? 3 : 1);
      const f = charge / d2 * alpha, d = Math.sqrt(d2);
      dx /= d; dy /= d;
      A.vx -= dx * f; A.vy -= dy * f; B.vx += dx * f; B.vy += dy * f;
    }
    for (const l of graph.links) {
      const A = idx.get(l.a), B = idx.get(l.b);
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || .01;
      const k = (d - rest[l.kind]) * strength[l.kind] * alpha;
      A.vx += dx / d * k; A.vy += dy / d * k; B.vx -= dx / d * k; B.vy -= dy / d * k;
    }
    for (const n of N) {
      const a = anchor(n.id);
      if (n.kind === 'folder' && a) { const R = n.level ? 300 : 230; n.vx += (a[0] * R - n.x) * .04; n.vy += (a[1] * R - n.y) * .04; }
      else if (a && CONTENT.has(n.kind)) { n.vx += (a[0] * 380 - n.x) * .006; n.vy += (a[1] * 380 - n.y) * .006; }
      else if (a) { n.vx += (a[0] * 300 - n.x) * .004; n.vy += (a[1] * 300 - n.y) * .004; }
      n.vx -= n.x * .002; n.vy -= n.y * .002;
      if (n.kind === 'core') { n.x = 0; n.y = 0; n.vx = 0; n.vy = 0; continue; }
      n.x += n.vx; n.y += n.vy; n.vx *= .55; n.vy *= .55;
    }
  }
  return Object.fromEntries(N.map(n => [n.id, [n.x, n.y * .82]]));
}

// 放射层级：以创作空间为圆心，按链接层数排成同心环。
export function radialLayout(graph) {
  const depth = new Map([['core', 0]]), parent = new Map(), q = ['core'];
  const adj = new Map(graph.nodes.map(n => [n.id, []]));
  const order = {contain: 0, source: 1, wiki: 1, tag: 2, mention: 3, resonance: 4};
  for (const l of [...graph.links].sort((a, b) => order[a.kind] - order[b.kind])) { adj.get(l.a).push(l.b); adj.get(l.b).push(l.a); }
  while (q.length) { const id = q.shift(); for (const o of adj.get(id)) if (!depth.has(o)) { depth.set(o, depth.get(id) + 1); parent.set(o, id); q.push(o); } }
  const pos = {core: [0, 0]};
  const kids = id => graph.nodes.filter(n => parent.get(n.id) === id).map(n => n.id);
  const leaves = id => { const k = kids(id); return k.length ? k.reduce((s, c) => s + leaves(c), 0) : 1; };
  const place = (id, a0, a1) => {
    const k = kids(id); let a = a0; const total = k.reduce((s, c) => s + leaves(c), 0) || 1;
    for (const c of k) {
      const span = (a1 - a0) * leaves(c) / total, mid = a + span / 2, R = [0, 150, 290, 410, 520][Math.min(depth.get(c), 4)];
      pos[c] = [Math.cos(mid) * R, Math.sin(mid) * R * .82];
      place(c, a, a + span); a += span;
    }
  };
  place('core', -Math.PI, Math.PI);
  for (const n of graph.nodes) if (!pos[n.id]) pos[n.id] = [0, 560];
  return pos;
}

// —— 本地图谱检索（规则匹配，未调用 AI）——
export function askGraph(graph, question, scope) {
  const q = question.trim();
  const C = graph.nodes.filter(n => CONTENT.has(n.kind));
  const real = graph.links.filter(l => l.kind !== 'contain');
  const name = id => graph.index.get(id)?.short || graph.index.get(id)?.title;
  const cards = [];
  if (/孤|没有连接|没链接|零散|断开/.test(q)) {
    const lonely = C.filter(n => !real.some(l => l.a === n.id || l.b === n.id));
    const weak = C.filter(n => n.in === 0 && !lonely.includes(n));
    cards.push({tone: 'warn', title: '孤立内容', en: 'Isolated', text: lonely.length ? `${lonely.length} 条内容除了目录外没有任何连接。` : '没有完全孤立的内容。', items: lonely.map(n => n.id)});
    cards.push({tone: 'info', title: '没有反链的内容', en: 'No backlinks', text: `${weak.length} 条内容只向外链接，还没有被其他内容引用。`, items: weak.slice(0, 8).map(n => n.id)});
  } else if (/双向|互链|共振|互相/.test(q)) {
    const mutual = real.filter(l => l.both).sort((a, b) => b.w - a.w);
    cards.push({tone: 'gold', title: '双向连接', en: 'Bidirectional', text: `共 ${mutual.length} 组：正文共同提及 ≥2 个概念，或选题与草稿互相记录。`, pairs: mutual.slice(0, 8).map(l => [l.a, l.b, l.kind === 'resonance' ? `共同提及 ${l.w} 个概念` : LINK_KINDS[l.kind]])});
  } else if (/未创建|空链|断链|缺/.test(q)) {
    const ghosts = graph.nodes.filter(n => n.kind === 'ghost');
    cards.push({tone: 'warn', title: '未创建的笔记', en: 'Unresolved links', text: `${ghosts.length} 个 [[双链]] 指向尚未在看板资料中出现的笔记，多来自生成模板。`, items: ghosts.map(n => n.id)});
  } else if (/核心|枢纽|中心|最重要|反链最多|被引用/.test(q)) {
    const top = [...C].sort((a, b) => (b.in + b.mutual) - (a.in + a.mutual) || b.deg - a.deg).slice(0, 6);
    cards.push({tone: 'gold', title: '连接最密的内容', en: 'Most connected', text: '按反链与双向连接数排序。', items: top.map(n => n.id), meta: top.map(n => `${n.deg} 条连接`)});
    const hubs = graph.nodes.filter(n => n.kind === 'concept').sort((a, b) => b.deg - a.deg).slice(0, 5);
    cards.push({tone: 'info', title: '最常被提及的概念', en: 'Top concepts', text: hubs.map(h => `${h.title}（${h.deg}）`).join('、'), items: hubs.map(n => n.id)});
  } else if (/下一篇|写什么|选题|延伸/.test(q)) {
    for (const idea of C.filter(n => n.kind === 'idea')) {
      const rel = latent(graph, idea.id).filter(r => graph.index.get(r.id).kind === 'post');
      cards.push({tone: 'info', title: idea.short, en: 'Next piece', text: rel.length ? `可以延伸 ${rel.length} 篇已发布作品，共享：${[...new Set(rel.flatMap(r => r.via))].slice(0, 4).join('、')}` : '暂未与已发布作品共享概念，可补充正文后再看。', items: [idea.id, ...rel.slice(0, 3).map(r => r.id)]});
    }
  } else if (/表现|观看|最好|数据|收藏/.test(q)) {
    const ps = C.filter(n => n.kind === 'post').sort((a, b) => b.post.views - a.post.views);
    cards.push({tone: 'gold', title: '作品表现', en: 'Performance', text: `观看最高：${ps[0].short}（${ps[0].post.views}）。下面按观看排序。`, items: ps.map(n => n.id), meta: ps.map(n => `${n.post.views} 观看 · ${n.post.saves} 收藏`)});
  } else {
    const words = q.replace(/[？?。，,！!]/g, ' ').split(/\s+/).filter(w => w.length >= 1);
    const hits = graph.nodes.filter(n => n.kind !== 'core').map(n => {
      const hay = (n.title + ' ' + (n.text || '') + ' ' + (n.path || '')).toLowerCase();
      const score = words.reduce((s, w) => s + (n.title.toLowerCase().includes(w.toLowerCase()) ? 3 : hay.includes(w.toLowerCase()) ? 1 : 0), 0);
      return {n, score};
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    cards.push(hits.length
      ? {tone: 'info', title: `与「${q}」相关`, en: 'Search', text: `在标题、正文和路径中找到 ${hits.length} 处匹配。点击可聚焦。`, items: hits.map(h => h.n.id)}
      : {tone: 'warn', title: '没有找到匹配', en: 'No match', text: '试试：孤立内容、双向连接、未创建的笔记、核心内容、下一篇写什么。', items: []});
  }
  if (scope) cards.forEach(c => { if (c.items) c.items.sort((a, b) => (b === scope) - (a === scope)); });
  return cards.map(c => ({...c, names: (c.items || []).map(name)}));
}
