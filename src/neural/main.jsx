import React, {useCallback, useDeferredValue, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {seedIdeas, seedDrafts, snapshot} from '../data';
import {posts, monthPosts} from './works';
import {CONFIG, asset} from '../config';
import {buildGraph, forceLayout, stats, KINDS} from './graph';
import {Home} from './Home';
import {Library, Drafts, Ideas} from './pages';
import {Count} from './Analysis';
import {Icon} from './icons';
import {T} from './theme';
import './neural.css';

// 选题、草稿与目标保存在当前浏览器（localStorage）。
function useSaved(key, fallback) {
  const [v, set] = useState(() => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, set];
}

function Modal({title, en, onClose, children, wide}) {
  const ref = useRef(null), closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.focus({preventScroll: true});
    const key = e => {
      if (e.key === 'Escape' && !e.isComposing) closeRef.current();
      if (e.key === 'Tab') {
        const list = [...ref.current.querySelectorAll('button,input,textarea,select,a[href]')].filter(n => !n.disabled);
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); if (before?.isConnected) before.focus({preventScroll: true}); };
  }, []);
  return <div className="veil" onClick={onClose}>
    <section ref={ref} tabIndex={-1} className={`modal glass ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
      <header><h2>{title} <em>{en}</em></h2><button className="icon-btn" onClick={onClose} aria-label="关闭弹窗"><Icon name="close" size={16}/></button></header>
      {children}
    </section>
  </div>;
}

const navs = [['home', '工作台', 'Workspace'], ['library', '作品库', 'Works'], ['drafts', '创作台', 'Drafts'], ['ideas', '选题池', 'Ideas']];
const initialPage = () => { const h = location.hash.slice(1); return navs.some(n => n[0] === h) ? h : 'home'; };

function Snapshot({goal, onGoal, ideas, drafts, onIdea, onDraft, onLibrary}) {
  const total = posts.reduce((s, p) => s + p.views, 0);
  const stats4 = [['已发布笔记', 'Published', posts.length], ['账号粉丝', 'Followers', snapshot.followers], ['累计观看', 'Total views', total], ['已知笔记涨粉', 'Known follows', posts.reduce((s, p) => s + (p.follows ?? 0), 0)]];
  const max = Math.max(...posts.map(p => p.views));
  return <section className="snapshot" aria-label="账号数据快照">
    <div className="snapshot-head"><p className="eyebrow">SNAPSHOT <span>账号快照</span></p><p className="quiet">{snapshot.source} · {snapshot.capturedAt} <em>Sample data</em></p></div>
    <div className="kpi-band glass">{stats4.map(([zh, en, v]) => <div key={zh}><span>{zh} <em>{en}</em></span><strong><Count value={v}/></strong></div>)}</div>
    <div className="snapshot-grid">
      <section className="glass card perf">
        <header><h2>作品表现 <em>Performance</em></h2><button className="text-btn" onClick={onLibrary}>全部作品 <em>All works</em><Icon name="arrow" size={14}/></button></header>
        <table><thead><tr><th>笔记 <em>Note</em></th><th>观看 <em>Views</em></th><th>收藏 <em>Saves</em></th><th>涨粉 <em>Follows</em></th></tr></thead>
          <tbody>{[...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(p => <tr key={p.id} onClick={() => onLibrary(p.id)}><td><span className="t-title">{p.title}</span><span className="t-bar"><i style={{'--w': p.views / max}}/></span></td><td>{p.views.toLocaleString('zh-CN')}</td><td>{p.saves}</td><td>{p.follows ?? '—'}</td></tr>)}</tbody></table>
        <p className="quiet">最近 6 篇 · 共 {posts.length} 篇 · 缺失数据保留为「—」<em>Latest 6 of {posts.length}</em></p>
      </section>
      <section className="glass card plan">
        <header><h2>创作计划 <em>Plan</em></h2></header>
        <div className="plan-body">
          <button className="ring" onClick={onGoal} aria-label={`修改目标，本月 ${monthPosts.length} 篇，目标 ${goal} 篇`}>
            <svg viewBox="0 0 180 180"><defs><linearGradient id="ring-g" x1="0" x2="1"><stop offset="0" stopColor={T.ring[0]}/><stop offset="1" stopColor={T.ring[1]}/></linearGradient></defs><circle cx="90" cy="90" r="72" className="track"/><circle cx="90" cy="90" r="72" className="value" strokeDasharray={`${Math.min(monthPosts.length / goal, 1) * 452.39} 452.39`}/></svg>
            <span><strong>{monthPosts.length}</strong>/{goal}<small>本月目标 Goal</small></span>
          </button>
          <div className="plan-ideas"><h3>下一篇写什么 <em>Up next</em></h3>{ideas.slice(0, 3).map((idea, i) => <button key={idea.id} onClick={() => onIdea(idea)}><b>{i + 1}</b><span>{idea.title}</span></button>)}</div>
        </div>
        <button className="plan-draft" onClick={() => onDraft(drafts[0]?.id)}><Icon name="draft" size={15}/>继续创作 <em>Continue</em><span>{drafts[0]?.title || '开始第一篇草稿'}</span><Icon name="arrow" size={15}/></button>
      </section>
    </div>
  </section>;
}

function App() {
  const [page, setPage] = useState(initialPage);
  const [goal, setGoal] = useSaved(CONFIG.storagePrefix + '-goal-v1', 8);
  const [ideas, setIdeas] = useSaved(CONFIG.storagePrefix + '-ideas-v1', seedIdeas);
  const [drafts, setDrafts] = useSaved(CONFIG.storagePrefix + '-drafts-v1', seedDrafts);
  const [active, setActive] = useState(() => drafts[0]?.id);
  const [focus, setFocus] = useState({mod: null, sel: null});
  const [libSel, setLibSel] = useState(posts[1].id);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [goalInput, setGoalInput] = useState(String(goal));
  const [toast, setToast] = useState('');
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const slowDrafts = useDeferredValue(drafts);
  const graph = useMemo(() => buildGraph({ideas, drafts: slowDrafts}), [ideas, slowDrafts]);
  const layout = useMemo(() => forceLayout(graph), [graph]);

  useEffect(() => { history.replaceState(null, '', page === 'home' ? location.pathname : '#' + page); window.scrollTo({top: 0}); }, [page]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t); }, [toast]);

  const close = useCallback(() => setModal(null), []);
  function newDraft(title = '未命名草稿', body = '', source) {
    const id = 'draft-' + Date.now();
    setDrafts(d => [{id, title, body, source}, ...d]);
    setActive(id); setPage('drafts'); setModal(null);
    setToast('草稿已创建，只保存在此浏览器 · Draft saved locally');
  }
  function editIdea(idea) { setEditing({...idea}); setModal('idea'); }
  function saveIdea() {
    if (!editing.title.trim()) return;
    setIdeas(ideas.some(i => i.id === editing.id) ? ideas.map(i => i.id === editing.id ? editing : i) : [...ideas, editing]);
    setModal(null); setToast('选题已保存 · Idea saved');
  }
  function toDraft(idea) {
    const existing = drafts.find(d => d.source === idea.id);
    if (existing) { setActive(existing.id); setPage('drafts'); setModal(null); setToast('已打开关联草稿 · Linked draft opened'); return; }
    const item = {...idea, status: '已转草稿'};
    setIdeas(ideas.some(i => i.id === item.id) ? ideas.map(i => i.id === item.id ? item : i) : [...ideas, item]);
    newDraft(item.title, `【根据选题创建的写作提纲，未调用 AI】\n\n创作方向：${item.note}\n\n开场：\n\n核心观点：\n\n操作示例：\n\n结尾：`, item.id);
  }
  function deleteDraft(id) {
    const d = drafts.find(x => x.id === id);
    if (!window.confirm(`删除草稿「${d?.title || '未命名草稿'}」？此操作只影响当前浏览器。`)) return;
    const rest = drafts.filter(x => x.id !== id);
    setDrafts(rest); setActive(rest[0]?.id); setToast('草稿已删除 · Draft deleted');
  }
  const onAction = useCallback(a => {
    if (a.type === 'page') { if (a.page === 'library') setLibSel(a.id); if (a.page === 'drafts') setActive(a.id); setPage(a.page); }
    if (a.type === 'read') setModal({read: graph.index.get(a.id)});
    if (a.type === 'editIdea') editIdea(a.idea);
    if (a.type === 'ideaToDraft') toDraft(a.idea);
  }, [graph, drafts, ideas]); // eslint-disable-line react-hooks/exhaustive-deps
  const openInGraph = id => { const n = graph.index.get(id); const mod = {post: 'works', note: 'methods', idea: 'ideas', draft: 'drafts', concept: 'concepts'}[n?.kind]; if (mod) { setFocus({mod, sel: id}); setPage('home'); } };
  const s = stats(graph);

  return <div className={`neural page-${page}`}>
    <header className="topbar">
      <a className="brand" href={asset('')} onClick={e => { e.preventDefault(); setPage('home'); setFocus({mod: null, sel: null}); }}>
        <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 28" width="18" height="21"><path fill={T.logo[0]} d="m14 1 8 7-2 12-7 7-10-5L1 12 8 4Z"/><path fill={T.logo[1]} d="m14 1-3 10 2 16 7-7 2-12Z"/><path fill={T.logo[2]} d="m14 1-3 10 11-3Z"/><path fill={T.logo[3]} d="m1 12 10-1 2 16-10-5Z"/></svg></span>
        <span className="brand-text">{CONFIG.brand.name} <b>/ {CONFIG.brand.sub}</b><small>{CONFIG.brand.tagline} · {CONFIG.brand.taglineEn}</small></span>
      </a>
      <nav aria-label="主导航">{navs.map(([id, zh, en]) => <button key={id} className={page === id ? 'active' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}>{zh}<em>{en}</em></button>)}</nav>
      <div className="top-actions">
        <button className="pill primary" onClick={() => newDraft()}><Icon name="plus" size={14}/>新建草稿 <em>New</em></button>
        <button className="avatar" onClick={() => setModal('about')} aria-label={`${snapshot.account}，查看账号与数据来源`}><img src={asset(CONFIG.avatar)} alt=""/></button>
      </div>
    </header>

    <main>
      {page === 'home' && <>
        <Home graph={graph} layout={layout} focus={focus} setFocus={setFocus} onAction={onAction} onAbout={() => setModal('about')} reduced={reduced}/>
        <Snapshot goal={goal} onGoal={() => { setGoalInput(String(goal)); setModal('goal'); }} ideas={ideas} drafts={drafts} onIdea={editIdea} onDraft={id => { setActive(id); setPage('drafts'); }} onLibrary={id => { if (typeof id === 'string') setLibSel(id); setPage('library'); }}/>
      </>}
      {page === 'library' && <Library graph={graph} selected={libSel} setSelected={setLibSel} onGo={openInGraph} onAction={onAction}/>}
      {page === 'drafts' && <Drafts graph={graph} drafts={drafts} setDrafts={setDrafts} active={active} setActive={setActive} onNew={() => newDraft()} onDelete={deleteDraft} onGo={openInGraph}/>}
      {page === 'ideas' && <Ideas graph={graph} ideas={ideas} onEdit={editIdea} onGraph={openInGraph} onNew={() => editIdea({id: Math.max(0, ...ideas.map(i => i.id)) + 1, title: '', platform: '小红书', priority: '中', status: '待写', note: ''})}/>}
    </main>

    <footer className="site-foot">
      <button onClick={() => setModal('about')}><Icon name="info" size={13}/>当前展示的是虚构示例数据，换成你自己的数据见 README <em>Sample data</em></button>
      <span>{CONFIG.footer.zh}<em>{CONFIG.footer.en}</em></span>
    </footer>

    {toast && <div className="toast glass" role="status"><Icon name="check" size={15}/>{toast}</div>}

    {modal === 'about' && <Modal title="关于这份数据" en="About the data" onClose={close}>
      <div className="about">
        <p>账号 <em>Account</em>：<strong>{snapshot.account}</strong> · 读取日期 <em>Captured</em>：{snapshot.capturedAt}</p>
        <p>数据来源 <em>Source</em>：{snapshot.source}；笔记首发 {snapshot.publishedFrom} — {snapshot.publishedTo}。</p>
        <hr/>
        <h3>图谱怎么来的 <em>How the graph is built</em></h3>
        <p>全部由 <code>src/data/sample.js</code> 里的资料在浏览器中推导，不读取外部 Obsidian 仓库：</p>
        <ul>
          <li><b>[[双链]] Wikilinks</b>：方法库笔记与草稿正文中的双链；找不到对应笔记的记为「未创建」。</li>
          <li><b>话题 Topics</b>：作品正文里的 # 话题标签。</li>
          <li><b>正文提及 Mentions</b>：内容中出现概念词（如「模板」「口播」），且至少两条内容提及才成为概念节点。</li>
          <li><b>双向共振 Resonance</b>：两条内容共同提及 ≥2 个概念，或选题与草稿互相记录。</li>
          <li><b>选题来源 Source</b>：草稿记录来源选题；选题状态为「已转草稿」时反向成立。</li>
        </ul>
        <p>作品库：{posts.length} 篇<b>示例作品</b>，账号、标题、日期与指标均为虚构，仅用于展示效果。</p>
        <p>当前：{s.content} 条内容 · {s.links} 条连接 · {s.mutual} 组双向 · {s.ghosts} 个未创建双链。</p>
        <p className="quiet">图谱分析是本地规则检索，未调用 AI。选题、草稿与目标保存在当前浏览器，不写入 Obsidian、不发布到平台。<em>Local rules only · no AI · nothing is published.</em></p>
      </div>
    </Modal>}
    {modal === 'goal' && <Modal title="本月发布目标" en="Monthly goal" onClose={close}>
      <form className="form" onSubmit={e => { e.preventDefault(); const n = Number(goalInput); if (Number.isInteger(n) && n >= 1 && n <= 100) { setGoal(n); setModal(null); setToast('发布目标已更新 · Goal updated'); } }}>
        <p className="quiet">本月已发布 {monthPosts.length} 篇。目标只保存在当前浏览器。</p>
        <label>目标篇数 <em>Target</em><input autoFocus type="number" min="1" max="100" step="1" required value={goalInput} onChange={e => setGoalInput(e.target.value)}/></label>
        <div className="form-actions"><button type="button" className="pill ghost" onClick={close}>取消 <em>Cancel</em></button><button className="pill primary">保存目标 <em>Save</em></button></div>
      </form>
    </Modal>}
    {modal === 'idea' && editing && <Modal title="选题详情" en="Idea" onClose={close}>
      <div className="form">
        <p className="quiet">编辑后保存在此浏览器 <em>Saved locally</em></p>
        <label>选题标题 <em>Title</em><input autoFocus value={editing.title} onChange={e => setEditing({...editing, title: e.target.value})}/></label>
        <div className="form-row">
          <label>优先级 <em>Priority</em><select value={editing.priority} onChange={e => setEditing({...editing, priority: e.target.value})}><option>高</option><option>中</option><option>低</option></select></label>
          <label>状态 <em>Status</em><select value={editing.status} onChange={e => setEditing({...editing, status: e.target.value})}><option>待写</option><option>待扩展</option><option>已转草稿</option></select></label>
        </div>
        <label>创作备注 <em>Brief</em><textarea value={editing.note} onChange={e => setEditing({...editing, note: e.target.value})}/></label>
        <div className="form-actions">
          <button className="pill ghost" disabled={!editing.title.trim()} onClick={saveIdea}>保存选题 <em>Save</em></button>
          <button className="pill primary" disabled={!editing.title.trim()} onClick={() => toDraft(editing)}><Icon name="draft" size={14}/>{drafts.some(d => d.source === editing.id) ? '打开关联草稿' : '转为草稿'} <em>{drafts.some(d => d.source === editing.id) ? 'Open draft' : 'To draft'}</em></button>
        </div>
        <p className="quiet">转为草稿只生成本地写作提纲，不模拟 AI 生成结果。</p>
      </div>
    </Modal>}
    {modal?.read && <Modal title={modal.read.short || modal.read.title} en={KINDS[modal.read.kind].en} onClose={close} wide>
      <div className="reader"><p className="quiet">{modal.read.path}</p><pre>{modal.read.body}</pre></div>
    </Modal>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
