import React, {useEffect, useMemo, useRef, useState} from 'react';
import {KINDS, CONTENT, MODULES, neighbors, latent, LINK_EN} from './graph';
import {Icon} from './icons';
import {Analysis, Count} from './Analysis';
import {snapshot} from '../data';
import {posts} from './works';
import {T} from './theme';

const fmt = v => v == null ? '—' : Number(v).toLocaleString('zh-CN');

export function PageHead({zh, en, sub, subEn, children}) {
  return <header className="page-head">
    <div><p className="eyebrow">{en.toUpperCase()} <span>{zh}</span></p><h1>{sub}</h1><p className="page-sub">{subEn}</p></div>
    {children && <div className="page-head-actions">{children}</div>}
  </header>;
}

// —— 作品库 Works ——
export function Library({graph, selected, setSelected, onGo, onAction}) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('date');
  const rate = p => p.views ? p.saves / p.views : -1;
  const rows = posts.filter(p => p.title.toLowerCase().includes(q.toLowerCase())).sort((a, b) =>
    sort === 'date' ? b.date.localeCompare(a.date) : sort === 'rate' ? rate(b) - rate(a) : (b[sort] ?? -1) - (a[sort] ?? -1));
  const order = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  const node = graph.index.get('post:' + selected) || graph.index.get('post:' + rows[0]?.id);
  const total = posts.reduce((s, p) => s + p.views, 0);
  const max = Math.max(...posts.map(p => p.views));
  const kpis = [['已发布', 'Published', posts.length], ['账号粉丝', 'Followers', snapshot.followers], ['累计观看', 'Total views', total], ['已知涨粉', 'Known follows', posts.reduce((s, p) => s + (p.follows ?? 0), 0)]];
  return <div className="page page-library">
    <PageHead zh="作品库" en="Works" sub="每一篇，都留下回响。" subEn="Every piece leaves an echo — metrics and links side by side."/>
    <section className="kpi-band glass">{kpis.map(([zh, en, v]) => <div key={zh}><span>{zh} <em>{en}</em></span><strong><Count value={v}/></strong></div>)}</section>
    <div className="library-layout">
      <section className="works-col">
        <div className="toolbar-row">
          <label className="search"><Icon name="search" size={15}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索作品… Search works" aria-label="搜索作品"/></label>
          <div className="seg" role="group" aria-label="排序">{[['date', '最新', 'Latest'], ['views', '观看', 'Views'], ['rate', '收藏率', 'Save rate'], ['follows', '涨粉', 'Follows']].map(([k, zh, en]) => <button key={k} className={sort === k ? 'active' : ''} onClick={() => setSort(k)}>{zh}<em>{en}</em></button>)}</div>
        </div>
        <div className="works-grid">{rows.map((p, i) => {
          const n = graph.index.get('post:' + p.id);
          const on = node?.id === n.id;
          return <button key={p.id} className={`work-card ${on ? 'active' : ''}`} onClick={() => setSelected(p.id)} style={{animationDelay: i * 60 + 'ms'}}>
            <span className="wc-cover">{n.cover ? <img src={n.cover} alt="" loading="lazy"/> : <span className="wc-fallback" style={{'--h': (order.indexOf(p) * 47) % 360}}><b>{p.title}</b><small>{n.media === 'video' ? '视频 · Video' : '图文 · Post'}</small></span>}<span className="wc-index">#{String(order.indexOf(p) + 1).padStart(2, '0')}</span></span>
            <span className="wc-body">
              <span className="wc-date">{p.date.slice(0, 10)} · {n.tags.length} topics</span>
              <span className="wc-title">{p.title}</span>
              <span className="wc-bar"><i style={{'--w': p.views / max}}/></span>
              <span className="wc-stats"><span>观看<em>Views</em><b>{fmt(p.views)}</b></span><span>收藏<em>Saves</em><b>{fmt(p.saves)}</b></span><span>⇄<em>Mutual</em><b>{n.mutual}</b></span></span>
            </span>
          </button>;
        })}</div>
        {!rows.length && <div className="empty"><Icon name="search" size={30}/><p>没有找到这篇作品 <em>No match</em></p><button className="pill" onClick={() => setQ('')}>清空搜索 <em>Clear</em></button></div>}
        <p className="source-line"><Icon name="info" size={13}/>{posts.length} 篇作品均为{snapshot.source}；「—」表示未提供 <em>Not provided</em>。</p>
      </section>
      {node && <aside className="library-analysis" key={node.id}><Analysis graph={graph} node={node} module={MODULES[0]} onGo={onGo} onAction={onAction} onClose={() => setSelected(null)}/></aside>}
    </div>
  </div>;
}

// —— 创作台 Drafts ——
function MiniGraph({graph, node}) {
  const nb = neighbors(graph, node.id);
  const all = [...nb.mutual.map(x => ({...x, dir: 'both'})), ...nb.out.map(x => ({...x, dir: 'out'})), ...nb.back.map(x => ({...x, dir: 'in'}))].slice(0, 16);
  const R = 92, C = 120;
  return <svg className="mini-graph" viewBox="0 0 240 240" role="img" aria-label={`${all.length} 条连接`}>
    <defs><radialGradient id="mg-core"><stop offset="0" stopColor={T.mini.glow0}/><stop offset=".5" stopColor={T.mini.core}/><stop offset="1" stopColor={T.mini.core} stopOpacity="0"/></radialGradient></defs>
    {all.map((x, i) => {
      const a = i / Math.max(all.length, 1) * Math.PI * 2 - Math.PI / 2, n = graph.index.get(x.id);
      const px = C + Math.cos(a) * R, py = C + Math.sin(a) * R;
      return <g key={x.id} style={{'--d': i * 60 + 'ms'}} className={`mg-link dir-${x.dir}`}>
        <line x1={C} y1={C} x2={px} y2={py} stroke={x.dir === 'both' ? T.mini.mutual : KINDS[n.kind].color}/>
        <circle cx={px} cy={py} r={n.kind === 'ghost' ? 3.5 : 4.5} fill={n.kind === 'ghost' ? 'none' : KINDS[n.kind].color} stroke={KINDS[n.kind].color} strokeDasharray={n.kind === 'ghost' ? '2 2' : undefined}/>
        {x.dir !== 'in' && <circle r="2.2" fill={T.mini.pulseOut} className="mg-pulse"><animateMotion dur={2 + i % 3 * .4 + 's'} repeatCount="indefinite" path={`M${C},${C} L${px},${py}`}/></circle>}
        {x.dir !== 'out' && <circle r="2" fill={T.mini.pulseIn} className="mg-pulse"><animateMotion dur={2.4 + i % 2 * .5 + 's'} repeatCount="indefinite" path={`M${px},${py} L${C},${C}`}/></circle>}
      </g>;
    })}
    <circle cx={C} cy={C} r="26" fill="url(#mg-core)"/>
    <circle cx={C} cy={C} r="8" fill={T.mini.dot}/>
  </svg>;
}

export function Drafts({graph, drafts, setDrafts, active, setActive, onNew, onDelete, onGo}) {
  const draft = drafts.find(d => d.id === active) || drafts[0];
  const area = useRef(null);
  const [suggest, setSuggest] = useState(null);
  const [pick, setPick] = useState(0);
  const change = (key, value) => setDrafts(drafts.map(d => d.id === draft.id ? {...d, [key]: value} : d));
  const titles = useMemo(() => graph.nodes.filter(n => CONTENT.has(n.kind) && n.id !== 'draft:' + draft?.id).map(n => ({id: n.id, title: n.path?.split('/').pop().replace(/\.md$/, '') || n.title, short: n.short || n.title, kind: n.kind})), [graph, draft?.id]);
  const check = el => {
    const before = el.value.slice(0, el.selectionStart);
    const m = before.match(/\[\[([^\]\n]*)$/);
    if (!m) { setSuggest(null); return; }
    const q = m[1].toLowerCase();
    const list = titles.filter(t => t.title.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)).slice(0, 7);
    setSuggest({q: m[1], start: el.selectionStart - m[1].length, list}); setPick(0);
  };
  const insert = t => {
    const el = area.current, s = suggest.start, e = el.selectionStart;
    const value = el.value.slice(0, s) + t.title + ']]' + el.value.slice(e).replace(/^\]\]/, '');
    change('body', value); setSuggest(null);
    requestAnimationFrame(() => { el.focus(); const pos = s + t.title.length + 2; el.setSelectionRange(pos, pos); });
  };
  const node = draft && graph.index.get('draft:' + draft.id);
  const nb = node ? neighbors(graph, node.id) : null;
  const wiki = node ? graph.links.filter(l => l.kind === 'wiki' && l.s === node.id).map(l => graph.index.get(l.t)) : [];
  return <div className="page page-drafts">
    <PageHead zh="创作台" en="Drafts" sub="把灵感，写成下一篇。" subEn="Write with [[links]] — every link grows a backlink.">
      <button className="pill primary" onClick={() => onNew()}><Icon name="plus" size={15}/>新建草稿 <em>New draft</em></button>
    </PageHead>
    <div className="drafts-layout">
      <aside className="draft-list glass">
        <h3>我的草稿 <em>My drafts</em><b>{drafts.length}</b></h3>
        {drafts.map(d => <button key={d.id} className={d.id === draft?.id ? 'active' : ''} onClick={() => setActive(d.id)}>
          <i/><span>{d.title || '未命名草稿'}<small>{(d.body || '').length} 字 chars · {graph.index.get('draft:' + d.id)?.deg || 0} 连接 links</small></span>
        </button>)}
        {!drafts.length && <p className="empty-line">还没有草稿 <em>No drafts yet</em></p>}
      </aside>
      {draft ? <section className="editor glass">
        <div className="editor-meta"><span>03-创作台 / 正在写 <em>Writing</em></span><span><Icon name="check" size={13}/>已保存到此浏览器 <em>Saved locally</em></span></div>
        <input className="editor-title" value={draft.title} onChange={e => change('title', e.target.value)} placeholder="给这篇内容一个标题 Title" aria-label="草稿标题"/>
        <div className="editor-area">
          <textarea ref={area} value={draft.body} aria-label="草稿正文" placeholder="开始写… 输入 [[ 链接到其他笔记 Type [[ to link a note"
            onChange={e => { change('body', e.target.value); check(e.target); }} onClick={e => check(e.target)}
            onKeyDown={e => {
              if (!suggest?.list.length) return;
              if (e.key === 'ArrowDown') { e.preventDefault(); setPick((pick + 1) % suggest.list.length); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setPick((pick - 1 + suggest.list.length) % suggest.list.length); }
              else if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); insert(suggest.list[pick]); }
              else if (e.key === 'Escape') setSuggest(null);
            }}/>
          {suggest && <div className="suggest glass" role="listbox" aria-label="链接建议">
            <p>链接到笔记 <em>Link to note</em>{suggest.q && <> · “{suggest.q}”</>}</p>
            {suggest.list.map((t, i) => <button key={t.id} role="option" aria-selected={i === pick} className={i === pick ? 'on' : ''} onMouseDown={e => { e.preventDefault(); insert(t); }} style={{'--kc': KINDS[t.kind].color}}><i/>{t.short}<small>{KINDS[t.kind].label} {KINDS[t.kind].en}</small></button>)}
            {!suggest.list.length && <span className="none">没有匹配，将成为未创建的笔记 <em>Will be unresolved</em></span>}
          </div>}
        </div>
        <footer className="editor-foot">
          <span>{(draft.body || '').length} 字 <em>chars</em> · {wiki.length} 个双链 <em>wikilinks</em></span>
          <button className="pill ghost danger" onClick={() => onDelete(draft.id)}><Icon name="trash" size={14}/>删除 <em>Delete</em></button>
        </footer>
      </section> : <section className="editor glass empty"><p>新建一篇草稿开始写作 <em>Create a draft to begin</em></p></section>}
      {node && <aside className="draft-links glass">
        <h3><Icon name="pulse" size={15}/>神经连接 <em>Neural links</em></h3>
        <MiniGraph graph={graph} node={node}/>
        <div className="dl-legend"><span><i className="out"/>出链 <em>Out</em> {nb.out.length}</span><span><i className="in"/>反链 <em>In</em> {nb.back.length}</span><span><i className="both"/>双向 <em>Mutual</em> {nb.mutual.length}</span></div>
        {[['[[双链]]', 'Wikilinks', wiki.map(n => n.id)], ['提及概念', 'Concepts', nb.out.filter(x => graph.index.get(x.id).kind === 'concept').map(x => x.id)], ['双向共振', 'Resonance', nb.mutual.map(x => x.id)], ['反链 · 来源', 'Backlinks', nb.back.map(x => x.id)]].filter(g => g[2].length).map(([zh, en, ids]) => <div className="dl-group" key={zh}>
          <p>{zh} <em>{en}</em></p>
          <div className="chip-row">{ids.map(id => { const n = graph.index.get(id); const go = CONTENT.has(n.kind) || n.kind === 'concept'; return go ? <button key={id} className="chip" style={{'--kc': KINDS[n.kind].color}} onClick={() => onGo(id)}>{n.short || n.title}</button> : <span key={id} className={`chip static ${n.kind === 'ghost' ? 'ghost' : ''}`} style={{'--kc': KINDS[n.kind].color}}>{n.short || n.title}</span>; })}</div>
        </div>)}
        {!node.deg && <p className="empty-line">写下内容或 [[链接]] 后，这里会长出连接。<em>Links appear as you write.</em></p>}
      </aside>}
    </div>
  </div>;
}

// —— 选题池 Ideas ——
const LANES = [['待写', 'To write'], ['待扩展', 'To expand'], ['已转草稿', 'Drafted']];
const PRI = {高: ['High', 'high'], 中: ['Medium', 'mid'], 低: ['Low', 'low']};

export function Ideas({graph, ideas, onEdit, onNew, onGraph}) {
  return <div className="page page-ideas">
    <PageHead zh="选题池" en="Ideas" sub="下一篇，从这里开始。" subEn="Ideas linked to what you have already published.">
      <button className="pill primary" onClick={onNew}><Icon name="plus" size={15}/>添加选题 <em>New idea</em></button>
    </PageHead>
    <div className="lanes">{LANES.map(([zh, en], li) => {
      const list = ideas.filter(i => i.status === zh);
      return <section className="lane glass" key={zh} style={{animationDelay: li * 90 + 'ms'}}>
        <header><span className={`lane-dot l${li}`}/>{zh} <em>{en}</em><b>{list.length}</b></header>
        {list.map((idea, i) => {
          const n = graph.index.get('idea:' + idea.id);
          const lat = n ? latent(graph, n.id) : [];
          const works = lat.filter(x => graph.index.get(x.id).kind === 'post');
          const [pen, pc] = PRI[idea.priority] || PRI['中'];
          return <article className={`idea-card pri-${pc}`} key={idea.id} style={{animationDelay: li * 90 + i * 70 + 140 + 'ms'}}>
            <div className="ic-top"><span className="ic-pri"><i/>{idea.priority} <em>{pen}</em></span><span className="ic-plat">{idea.platform}</span></div>
            <h3>{idea.title || '未命名选题'}</h3>
            <p>{idea.note || '还没有创作备注。'}</p>
            {n?.shared?.length > 0 && <div className="chip-row">{n.shared.slice(0, 5).map(c => <span key={c} className="chip static" style={{'--kc': KINDS.concept.color}}>{c}</span>)}</div>}
            <div className="ic-reach"><Icon name="link" size={13}/>{works.length ? <>可延伸 {works.length} 篇作品 <em>builds on {works.length} works</em></> : <>暂无关联作品 <em>No related works</em></>}</div>
            <footer>
              <button className="pill ghost" onClick={() => onGraph(n.id)}><Icon name="concept" size={14}/>图谱 <em>Graph</em></button>
              <button className="pill" onClick={() => onEdit(idea)}>编辑 <em>Edit</em><Icon name="chevron" size={13}/></button>
            </footer>
          </article>;
        })}
        {!list.length && <p className="empty-line">这个状态下还没有选题 <em>Nothing here yet</em></p>}
      </section>;
    })}</div>
  </div>;
}
