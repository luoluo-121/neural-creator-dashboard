#!/usr/bin/env node
// 自检：skill 格式、导入脚本、当前数据结构、页面素材。
// 用法：npm run verify              日常检查
//       npm run verify -- --release  发布前检查（另外要求仓库地址占位符已替换）
import {readFileSync, existsSync, mkdtempSync, rmSync} from 'node:fs';
import {join, resolve, dirname, basename} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const release = process.argv.includes('--release');
const errors = [], warnings = [];
const ok = msg => console.log('  ✓ ' + msg);
const fail = msg => errors.push(msg);

// 1. Skill
console.log('Skill');
const skillDir = join(ROOT, 'skills/neural-creator-dashboard');
const skillFile = join(skillDir, 'SKILL.md');
if (!existsSync(skillFile)) fail('缺少 skills/neural-creator-dashboard/SKILL.md');
else {
  const text = readFileSync(skillFile, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) fail('SKILL.md 缺少 YAML frontmatter');
  else {
    const field = k => (m[1].match(new RegExp(`^${k}:\\s*(.*)$`, 'm')) || [])[1]?.trim();
    const name = field('name'), desc = field('description');
    if (!name) fail('SKILL.md 缺少 name');
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) fail(`name「${name}」只能用小写字母、数字和单个连字符，且不超过 64 个字符`);
    else if (name !== basename(skillDir)) fail(`name「${name}」必须与文件夹名「${basename(skillDir)}」一致`);
    else ok(`name：${name}`);
    if (!desc) fail('SKILL.md 缺少 description');
    else if (desc.length > 1024) fail(`description 超过 1024 个字符（${desc.length}）`);
    else ok(`description：${desc.length} 个字符`);
    if (!m[2].trim()) fail('SKILL.md 正文为空');
    else ok('正文存在');
  }
}
for (const f of ['skills/neural-creator-dashboard/SKILL.md', 'README.md', 'AGENTS.md', 'package.json']) {
  if (existsSync(join(ROOT, f)) && readFileSync(join(ROOT, f), 'utf8').includes('YOUR_GITHUB_USER')) {
    (release ? errors : warnings).push(`${f} 里还有仓库地址占位符 YOUR_GITHUB_USER${release ? '' : '（发布前替换）'}`);
  }
}

// 2. 数据结构
function check(m, label) {
  const errs = [];
  for (const k of ['snapshot', 'posts', 'postContent', 'notes', 'seedIdeas', 'seedDrafts', 'concepts']) if (!(k in m)) errs.push(`缺少导出 ${k}`);
  if (errs.length) return errs;
  if (!m.posts.length) errs.push('posts 为空');
  for (const p of m.posts) {
    if (typeof p.id !== 'string' || !p.id) errs.push(`作品缺少 id：${p.title}`);
    if (!/^\d{4}-\d{2}-\d{2}/.test(p.date || '')) errs.push(`作品日期格式不对：${p.title}`);
    if (typeof p.views !== 'number') errs.push(`作品 views 必须是数字：${p.title}`);
    if (!m.postContent.some(c => c.title === p.title)) errs.push(`postContent 里找不到作品：${p.title}`);
  }
  if (new Set(m.posts.map(p => p.id)).size !== m.posts.length) errs.push('作品 id 有重复');
  for (const n of m.notes) if (!/^05-方法库 methods\/[^/]+\/.+/.test(n.path || '')) errs.push(`笔记 path 格式不对：${n.title}`);
  for (const i of m.seedIdeas) if (typeof i.id !== 'number' || !['待写', '待扩展', '已转草稿'].includes(i.status)) errs.push(`选题 id 须为数字、status 须为 待写/待扩展/已转草稿：${i.title}`);
  for (const d of m.seedDrafts) if (d.source != null && !m.seedIdeas.some(i => i.id === d.source)) errs.push(`草稿的来源选题不存在：${d.title}`);
  for (const c of m.concepts) if (!Array.isArray(c) || typeof c[0] !== 'string' || !Array.isArray(c[1])) errs.push('concepts 格式应为 [概念名, [关键词…]]');
  return errs;
}

console.log('导入脚本');
const tmp = mkdtempSync(join(tmpdir(), 'ncd-verify-'));
try {
  const out = join(tmp, 'data.js');
  execFileSync(process.execPath, [join(ROOT, 'scripts/import-notes.mjs'), '--vault', join(ROOT, 'examples/vault'), '--out', out], {stdio: 'pipe'});
  const m = await import(pathToFileURL(out).href);
  const errs = check(m, 'examples');
  if (errs.length) errs.forEach(e => fail('示例导入：' + e));
  else ok(`examples/vault → 作品 ${m.posts.length}、方法笔记 ${m.notes.length}、选题 ${m.seedIdeas.length}、草稿 ${m.seedDrafts.length}、概念 ${m.concepts.length}`);
} catch (e) {
  fail('导入脚本运行失败：' + (e.stderr?.toString() || e.message));
} finally {
  rmSync(tmp, {recursive: true, force: true});
}

console.log('当前数据');
const index = readFileSync(join(ROOT, 'src/data/index.js'), 'utf8');
const source = (index.match(/from '\.\/([^']+)'/) || [])[1];
if (!source || !existsSync(join(ROOT, 'src/data', source))) fail(`src/data/index.js 指向的文件不存在：${source}`);
else {
  const errs = check(await import(pathToFileURL(join(ROOT, 'src/data', source)).href), source);
  if (errs.length) errs.forEach(e => fail(`${source}：${e}`));
  else ok(`src/data/${source} 结构正确`);
}

// 3. 核心动效：发光的光球与五只水母是这个看板的核心，不能被删掉或改成静态
console.log('核心动效（光球与水母）');
const home = readFileSync(join(ROOT, 'src/neural/Home.jsx'), 'utf8');
const graphSrc = readFileSync(join(ROOT, 'src/neural/graph.js'), 'utf8');
const core = [
  ['光球视频', /className="orb"[\s\S]{0,400}<video [^>]*src=\{T\.media\.orb\}/],
  ['光球周围的光点', /orb-dust/],
  ['每个模块一只水母视频', /MODULES\.map\(m => \{[\s\S]{0,600}className=\{`jelly [\s\S]{0,600}<video [^>]*src=\{T\.media\.jelly\}/],
  ['视频逐帧画到画布显示（兼容不合成 <video> 的内置浏览器）', /function paintVideo\(pair\)[\s\S]*drawImage[\s\S]*for \(const pair of Object\.values\(vids\.current\)\) paintVideo\(pair\)/],
  ['光球与水母的逐帧动画', /const step = now => \{[\s\S]*orbRef\.current\.style\.transform[\s\S]*el\.style\.transform/],
  ['动画循环防中断（先排下一帧、出错不停）', /const frame = now => \{ raf = requestAnimationFrame\(frame\); try \{ step\(now\); \}/],
  ['时间差不为负', /const dt = Math\.max\(0,/]
];
for (const [label, re] of core) if (!re.test(home)) fail(`Home.jsx 缺少核心动效：${label}`); else ok(label);
const modules = (graphSrc.match(/export const MODULES = \[([\s\S]*?)\n\];/) || [])[1] || '';
if ((modules.match(/\{id: '/g) || []).length !== 5) fail('graph.js 的 MODULES 应为 5 个模块（5 只水母）');
else ok('5 个模块 → 5 只水母');
for (const f of ['media/orb.mp4', 'media/jellyfish.mp4']) if (!existsSync(join(ROOT, 'public', f))) fail(`缺少核心素材 public/${f}`);

// 4. 页面与素材
console.log('页面与素材');
const theme = readFileSync(join(ROOT, 'src/neural/theme.js'), 'utf8');
const media = [...theme.matchAll(/asset\('(media\/[^']+)'\)/g)].map(x => x[1]);
const avatar = (readFileSync(join(ROOT, 'src/config.js'), 'utf8').match(/avatar:\s*'([^']+)'/) || [])[1];
const missing = [...new Set([...media, avatar])].filter(f => f && !existsSync(join(ROOT, 'public', f)));
for (const f of ['index.html']) if (!existsSync(join(ROOT, f))) missing.push(f);
if (missing.length) missing.forEach(f => fail('缺少文件：' + f));
else ok(`入口页面、${new Set(media).size} 个视频与海报、头像都在`);

for (const w of warnings) console.log('  ! ' + w);
if (errors.length) { console.error('\n未通过：'); errors.forEach(e => console.error('  ✗ ' + e)); process.exit(1); }
console.log('\n全部通过。');
