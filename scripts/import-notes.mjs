#!/usr/bin/env node
// 把一个 Markdown 笔记文件夹（例如 Obsidian 仓库）转换成看板数据 src/data/my-data.js，并让看板改读它。
// 只用 Node 自带模块，不联网，不修改你的笔记。
//
// 用法：
//   node scripts/import-notes.mjs --vault <笔记文件夹> [选项]
//   node scripts/import-notes.mjs --reset            # 切回示例数据
//
// 选项：
//   --works <文件夹>     作品所在文件夹（相对 vault，可多次传）；不传时按文件夹名自动识别
//   --methods <文件夹>   方法笔记所在文件夹
//   --ideas <文件夹>     选题所在文件夹
//   --drafts <文件夹>    草稿所在文件夹
//   --all-as-notes       没被识别的笔记也作为方法笔记导入
//   --account <名字>     账号名（默认「我的账号」）
//   --followers <数字>   粉丝数
//   --max-works <数字>   最多导入多少篇作品（默认 30，按日期取最新）
//   --max-notes <数字>   最多导入多少篇方法笔记（默认 40）
//   --out <文件>         输出到指定文件，且不切换看板数据（用于测试）
import {readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync} from 'node:fs';
import {join, relative, resolve, dirname, basename, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src/data');
const INDEX = join(DATA, 'index.js');
const indexFor = file => `// 看板读取的数据入口。默认使用虚构示例；运行 \`npm run import -- --vault <笔记文件夹>\` 后会切换到 my-data.js。\nexport * from './${file}';\n`;

// —— 参数 ——
const args = process.argv.slice(2);
const opt = {works: [], methods: [], ideas: [], drafts: []};
for (let i = 0; i < args.length; i++) {
  const a = args[i], next = () => args[++i];
  if (a === '--vault') opt.vault = next();
  else if (['--works', '--methods', '--ideas', '--drafts'].includes(a)) opt[a.slice(2)].push(next());
  else if (a === '--all-as-notes') opt.allAsNotes = true;
  else if (a === '--account') opt.account = next();
  else if (a === '--followers') opt.followers = Number(next());
  else if (a === '--max-works') opt.maxWorks = Number(next());
  else if (a === '--max-notes') opt.maxNotes = Number(next());
  else if (a === '--out') opt.out = next();
  else if (a === '--reset') opt.reset = true;
  else if (a === '-h' || a === '--help') opt.help = true;
  else { console.error(`未知参数：${a}（用 --help 查看用法）`); process.exit(1); }
}
if (opt.help) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 20).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
if (opt.reset) { writeFileSync(INDEX, indexFor('sample.js')); console.log('已切回示例数据（src/data/sample.js）。'); process.exit(0); }
if (!opt.vault || !existsSync(opt.vault) || !statSync(opt.vault).isDirectory()) { console.error('请用 --vault 指定一个存在的笔记文件夹。'); process.exit(1); }
const VAULT = resolve(opt.vault);
const maxWorks = opt.maxWorks || 30, maxNotes = opt.maxNotes || 40;

// —— 读取 Markdown ——
const SKIP = new Set(['.obsidian', '.trash', '.git', 'node_modules', '.DS_Store']);
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.')) continue;
    const p = join(dir, name), st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.toLowerCase().endsWith('.md')) out.push(p);
  }
  return out;
}

// 简化的 YAML frontmatter：key: value、key: [a, b]、以及「- 项」列表。
function parse(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fm = {};
  if (m) {
    let key = null;
    for (const raw of m[1].split(/\r?\n/)) {
      const item = raw.match(/^\s*-\s+(.*)$/);
      if (item && key) { if (!Array.isArray(fm[key])) fm[key] = []; fm[key].push(unquote(item[1])); continue; }
      const kv = raw.match(/^([^:#][^:]*):\s*(.*)$/);
      if (!kv) continue;
      key = kv[1].trim();
      const v = kv[2].trim();
      fm[key] = v.startsWith('[') && v.endsWith(']') ? v.slice(1, -1).split(',').map(unquote).filter(Boolean) : v === '' ? '' : unquote(v);
    }
  }
  return {fm, body: m ? text.slice(m[0].length) : text};
}
const unquote = s => String(s).trim().replace(/^['"]|['"]$/g, '');
const pick = (fm, keys) => { for (const k of keys) for (const f of Object.keys(fm)) if (f.toLowerCase() === k.toLowerCase() && fm[f] !== '') return fm[f]; return undefined; };
function num(v) {
  if (v == null || v === '') return null;
  const s = String(v).replace(/[,，\s%秒s]/gi, '');
  const m = s.match(/^(-?\d+(?:\.\d+)?)(万|w|k|千)?$/i);
  if (!m) return null;
  const mul = {万: 1e4, w: 1e4, W: 1e4, k: 1e3, K: 1e3, 千: 1e3}[m[2]] || 1;
  return Math.round(Number(m[1]) * mul * 10) / 10;
}
const pad = n => String(n).padStart(2, '0');
function dateOf(v, file) {
  // 只有日期时按本地时间的 00:00 解析（避免被当成 UTC 而跨天）
  const s = v ? String(v).trim().replace(/\//g, '-').replace(/^(\d{4}-\d{1,2}-\d{1,2})$/, '$1 00:00') : '';
  const d = s ? new Date(s) : null;
  const t = d && !isNaN(d) ? d : statSync(file).mtime;
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
}
function tagsOf(fm, body) {
  const raw = pick(fm, ['tags', 'tag', '标签', '话题']);
  const list = Array.isArray(raw) ? raw : raw ? String(raw).split(/[,，\s]+/) : [];
  for (const m of body.matchAll(/(?:^|\s)#([^\s#，。,.!?！？、；;:：()（）[\]]+)/g)) list.push(m[1]);
  return [...new Set(list.map(t => t.replace(/^#/, '').trim()).filter(t => t && !/^\d+$/.test(t)))].slice(0, 12);
}
const clean = body => body.replace(/\r/g, '').trim().slice(0, 6000);

// —— 分类 ——
const RULES = [
  ['works', /(作品|works?$|published|已发布)/i],
  ['drafts', /(草稿|创作台|drafts?$|正在写|写作中)/i],
  ['ideas', /(选题|ideas?$|灵感)/i],
  ['methods', /(方法|methods?$|模板|templates?$|流程|workflow|知识|卡片|notes?$)/i]
];
const norm = p => p.split(/[\\/]/).filter(Boolean).join('/');
function classify(rel) {
  const dirs = rel.split(sep).slice(0, -1);
  for (const kind of ['works', 'drafts', 'ideas', 'methods']) for (const f of opt[kind]) {
    const prefix = norm(f);
    if (norm(rel).startsWith(prefix + '/')) return {kind, root: prefix.split('/').length};
  }
  for (let i = 0; i < dirs.length; i++) for (const [kind, re] of RULES) {
    if (opt[kind].length) continue;
    if (re.test(dirs[i])) return {kind, root: i + 1};
  }
  return opt.allAsNotes ? {kind: 'methods', root: 0} : null;
}

const files = walk(VAULT);
const bucket = {works: [], methods: [], ideas: [], drafts: []};
for (const file of files) {
  const rel = relative(VAULT, file), c = classify(rel);
  if (!c) continue;
  const {fm, body} = parse(readFileSync(file, 'utf8'));
  const title = String(pick(fm, ['title', '标题', 'name']) || basename(file).replace(/\.md$/i, '')).trim();
  bucket[c.kind].push({file, rel, root: c.root, fm, body, title});
}

// —— 生成数据 ——
const works = bucket.works.map(x => {
  const media = /视频|video/i.test(String(pick(x.fm, ['media', '类型', 'type', '形式']) || '')) ? 'video' : 'images';
  const p = {
    title: x.title, date: dateOf(pick(x.fm, ['date', '发布时间', '发布日期', 'published', 'publishedAt', 'created', '创建时间']), x.file),
    views: num(pick(x.fm, ['views', '观看', '浏览', '阅读', '播放'])) ?? 0,
    likes: num(pick(x.fm, ['likes', '点赞'])) ?? 0,
    comments: num(pick(x.fm, ['comments', '评论'])) ?? 0,
    saves: num(pick(x.fm, ['saves', '收藏'])) ?? 0,
    follows: num(pick(x.fm, ['follows', '涨粉'])),
    shares: num(pick(x.fm, ['shares', '分享', '转发'])) ?? 0,
    impressions: num(pick(x.fm, ['impressions', '曝光'])),
    ctr: num(pick(x.fm, ['ctr', '点击率', '封面点击率'])),
    duration: num(pick(x.fm, ['duration', '平均观看', '平均观看时长', '时长']))
  };
  return {post: p, content: {title: x.title, body: clean(x.body), tags: tagsOf(x.fm, x.body), media}};
}).sort((a, b) => b.post.date.localeCompare(a.post.date)).slice(0, maxWorks)
  .map((w, i) => ({...w, post: {id: 'w' + (i + 1), ...w.post}}));

const notes = bucket.methods.slice(0, maxNotes).map((x, i) => {
  const parts = x.rel.split(sep);
  const sub = parts[x.root] && x.root < parts.length - 1 ? parts[x.root] : (parts[x.root - 1] || '笔记');
  return {id: 'n' + (i + 1), title: x.title, path: `05-方法库 methods/${sub}/${parts[parts.length - 1]}`, body: clean(x.body), tags: tagsOf(x.fm, x.body)};
});

const ideas = bucket.ideas.map((x, i) => {
  const status = String(pick(x.fm, ['status', '状态']) || '待写');
  return {id: i + 1, title: x.title, platform: String(pick(x.fm, ['platform', '平台']) || '小红书'), priority: ['高', '中', '低'].includes(String(pick(x.fm, ['priority', '优先级']))) ? String(pick(x.fm, ['priority', '优先级'])) : '中',
    status: ['待写', '待扩展', '已转草稿'].includes(status) ? status : '待写', note: String(pick(x.fm, ['note', '备注', 'description', '简介']) || clean(x.body).replace(/^#.*\n/, '').trim().slice(0, 120))};
});

const drafts = bucket.drafts.map((x, i) => {
  const src = String(pick(x.fm, ['source', '来源选题', '选题']) || '');
  const idea = ideas.find(d => d.title === src);
  return {id: 'draft-' + (i + 1), title: x.title, body: clean(x.body), source: idea ? idea.id : null};
});

// 概念词：至少在两条内容里出现的话题标签，取出现最多的 20 个。
const count = new Map();
for (const t of [...works.flatMap(w => w.content.tags), ...notes.flatMap(n => n.tags)]) count.set(t, (count.get(t) || 0) + 1);
const concepts = [...count].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => [t, [t.toLowerCase()]]);

const dates = works.map(w => w.post.date.slice(0, 10)).sort();
const today = new Date();
const snapshot = {
  account: opt.account || '我的账号', followers: Number.isFinite(opt.followers) ? opt.followers : null,
  capturedAt: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  publishedFrom: dates[0] || '', publishedTo: dates[dates.length - 1] || '', source: '导入自本地笔记'
};

if (!works.length) {
  console.error(`没有找到作品笔记。请确认作品放在名字包含「作品 / works」的文件夹里，或用 --works <文件夹> 指定。\n识别到：方法笔记 ${notes.length}、选题 ${ideas.length}、草稿 ${drafts.length}。`);
  process.exit(2);
}

const J = v => JSON.stringify(v, null, 1);
const out = `// 由 scripts/import-notes.mjs 从「${basename(VAULT)}」生成。包含你的个人笔记内容，默认不提交到 git（见 .gitignore）。
// 重新导入：npm run import -- --vault <笔记文件夹>；切回示例数据：npm run import -- --reset

export const snapshot = ${J(snapshot)};

export const posts = ${J(works.map(w => w.post))};

export const postContent = ${J(works.map(w => w.content))};

export const notes = ${J(notes.map(({tags, ...n}) => n))};

export const seedIdeas = ${J(ideas)};

export const seedDrafts = ${J(drafts)};

export const concepts = ${J(concepts)};
`;
const target = opt.out ? resolve(opt.out) : join(DATA, 'my-data.js');
mkdirSync(dirname(target), {recursive: true});
writeFileSync(target, out);
if (!opt.out) writeFileSync(INDEX, indexFor('my-data.js'));

console.log(`导入完成：作品 ${works.length}、方法笔记 ${notes.length}、选题 ${ideas.length}、草稿 ${drafts.length}、概念词 ${concepts.length}`);
console.log(`输出：${relative(process.cwd(), target) || target}${opt.out ? '' : '（看板已切换到这份数据）'}`);
if (!concepts.length) console.log('提示：没有生成概念词（需要同一个话题标签出现在至少两条笔记里），可以手动编辑输出文件末尾的 concepts。');
if (bucket.works.length > maxWorks) console.log(`提示：作品共 ${bucket.works.length} 篇，只取了最新的 ${maxWorks} 篇（--max-works 可调整）。`);
