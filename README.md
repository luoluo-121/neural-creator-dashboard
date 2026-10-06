# Neural Creator Dashboard · 创作神经网络看板

> **使用许可：学习与非商业使用。** 当前授权政策为 [PolyForm Noncommercial 1.0.0](LICENSE)，不授予商业使用权限。商业使用需另行授权。这是源码公开项目，不是允许任意商业使用的开源许可。
> **历史例外：** 0.1.0 曾以 MIT 发布，旧版已授出的权利不受影响，包括其中未变更的代码。详见 [授权说明](NOTICE.md)。

把你的作品、笔记、选题和草稿，变成一张会呼吸的神经网络：中心是一颗光球，五只发光的水母代表五个模块，点开水母，触须像伞一样展开到每一篇内容；点开一篇，右侧弹出它的全部数据和双向链接。

Turn your works, notes, ideas and drafts into a living neural network — an orb, five glowing jellyfish modules, umbrella-like tentacles to every piece, and a full analysis panel for each one.

> 仓库里的账号、作品、笔记、选题、草稿**全部是虚构的示例数据**。

## 它能做什么

- **工作台**：光球点亮、粒子迸发，背景网络从光球蔓延开，五只水母（作品库、概念网络、方法库、选题池、创作台）围绕光球游动。
- **三层交互**：点水母 → 光球退到左侧、水母列队，触须扇形展开到该模块的每一篇内容；点内容 → 右侧滑出分析栏（指标、收藏率、出链 / 反链 / 双向、话题、二度关联）；Esc 或面包屑逐层返回。
- **问你的图谱**：底部对话框可以问「最核心的内容」「双向连接有哪些」「下一篇写什么」「未创建的笔记」，按本地规则检索，不调用 AI。
- **作品库 / 创作台 / 选题池**三个内页：作品卡片与排序、草稿编辑（支持 `[[` 双链补全）、选题转草稿。
- **银灰配色**：中性深灰底、银灰光球、香槟金点缀，颜色集中在 `src/neural/theme.js` 和 `neural.css` 顶部的 CSS 变量里。
- **中英双语**界面，尊重系统的「减少动态效果」设置。
- 纯前端，选题、草稿和目标保存在浏览器 `localStorage`，无后台同步服务。

## 快速开始

需要 Node.js 20.19+ 或 22.12+。

```bash
git clone https://github.com/luoluo-121/neural-creator-dashboard.git
cd neural-creator-dashboard
npm install
npm run dev
```

打开终端里显示的地址（默认 http://127.0.0.1:5173/ ）。

## 让你的 AI 智能体来装（Claude、Codex、Kimi、Cursor……）

仓库自带一个通用格式的 skill（`skills/neural-creator-dashboard/SKILL.md`），一条命令装到你电脑上的智能体：

```bash
npx skills add luoluo-121/neural-creator-dashboard
```

装好后对智能体说：

> 用 neural-creator-dashboard 这个 skill，把我的笔记做成神经网络看板，笔记在 <你的笔记文件夹>。

也可以手动安装：把 `skills/neural-creator-dashboard` 整个文件夹复制到对应目录。

| 智能体 | 全局目录 | 项目内目录 |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `.claude/skills/` |
| Codex | `~/.codex/skills/` | `.agents/skills/` |
| Kimi Code CLI | `~/.agents/skills/` | `.agents/skills/` |
| Cursor | `~/.cursor/skills/` | `.agents/skills/` |
| Gemini CLI | `~/.gemini/skills/` | `.agents/skills/` |
| Qwen Code | `~/.qwen/skills/` | `.qwen/skills/` |

不支持 skill 的智能体，直接对它说：

> 克隆 https://github.com/luoluo-121/neural-creator-dashboard ，按仓库里的 AGENTS.md 帮我装好，并导入我的笔记。

## 换成你自己的数据

### 方式一：导入 Obsidian / Markdown 笔记（推荐）

```bash
npm run import -- --vault "<你的笔记文件夹>" --account "<账号名>" --followers 1280
```

- 按文件夹名自动识别：名字含「作品 / works」的是作品，「方法 / 模板 / 流程 / methods」的是方法笔记，「选题 / ideas」的是选题，「草稿 / 创作台 / drafts」的是草稿；也可以用 `--works`、`--methods`、`--ideas`、`--drafts` 指定文件夹。
- 作品数据写在 frontmatter 里，中英文字段都认（`观看/views`、`收藏/saves`、`点赞/likes`、`发布时间/date`、`类型/media`……），支持「1.2万」「12.4%」这类写法。
- 正文的 `[[双链]]` 自动连线；同一个话题标签出现在两条以上内容里，会成为「概念」节点。
- 格式参考 `examples/vault/`，可以先 `npm run import -- --vault examples/vault` 试试。
- 导入结果写到 `src/data/my-data.js`（已在 `.gitignore`，不会被提交）；`npm run import -- --reset` 切回示例数据；`npm run import -- --help` 查看全部选项。
- 导入脚本只读你的笔记、不联网。

### 方式二：手动改数据

1. **`src/config.js`**：品牌名、图谱中心的名字、头像（放进 `public/`）、页脚文字、本地存储的键名前缀。
2. **`src/data/sample.js`**（或你自己的 `my-data.js`）：所有内容数据，字段如下。

| 导出 | 内容 | 关键字段 |
|---|---|---|
| `snapshot` | 账号概况 | `account` 账号名、`followers` 粉丝数、`capturedAt` 数据日期、`source` 来源说明 |
| `posts` / `postContent` | 作品（由 `W(...)` 一次写出） | 指标：`views` `likes` `comments` `saves` `follows` `shares` `impressions` `ctr` `duration`，缺失填 `null`；内容：`body` 正文、`tags` 话题、`media`（`images` / `video`） |
| `notes` | 方法库笔记 | `title`、`path`（第二段是子目录）、`body`（可以写 `[[双链]]`） |
| `seedIdeas` | 选题池 | `title`、`priority`（高 / 中 / 低）、`status`（待写 / 待扩展 / 已转草稿）、`note` |
| `seedDrafts` | 创作台草稿 | `title`、`body`、`source`（来源选题的 id） |
| `concepts` | 概念词表 | `[概念名, [关键词…]]`，换成你所在领域的词 |

改完刷新页面即可。如果浏览器里已经保存过选题和草稿，想看到新的示例数据，可以把 `storagePrefix` 改个名字，或清空该站点的 localStorage。

## 图谱是怎么连起来的

全部在浏览器里由数据推导（见 `src/neural/graph.js`）：

| 连接 | 规则 |
|---|---|
| 目录归属 | 内容属于哪个模块 / 子目录 |
| `[[双链]]` | 笔记与草稿正文里的双链；找不到对应内容的显示为「未创建」 |
| 选题来源 | 草稿记录了来源选题；选题状态为「已转草稿」时反向也成立 |
| 话题标签 | 作品的话题 |
| 正文提及 | 正文出现概念词；至少两条内容提及，才成为概念节点 |
| 双向共振 | 两条内容共同提及 ≥ 2 个概念 |

## 目录结构

```
├── index.html                 页面入口
├── AGENTS.md                  写给 AI 智能体的开发说明（CLAUDE.md 指向它）
├── skills/neural-creator-dashboard/SKILL.md   通用 Agent Skill
├── scripts/import-notes.mjs   笔记导入；scripts/verify.mjs 自检（npm run verify）
├── examples/vault/            虚构的示例笔记库
├── public/media/              光球与水母视频
├── src/config.js              个性化配置
├── src/data/index.js          数据入口（示例 / 你的数据）
├── src/data/sample.js         示例数据（虚构）
└── src/neural/
    ├── graph.js               图谱推导、布局、本地检索
    ├── Home.jsx               光球、水母、触须场景与三层交互
    ├── NetworkCanvas.jsx      背景神经网络
    ├── Analysis.jsx           右侧分析栏
    ├── pages.jsx              作品库 / 创作台 / 选题池
    ├── main.jsx               页面框架与弹窗
    ├── theme.js               配色与素材路径
    └── neural.css             样式
```

## 部署

```bash
npm run build
```

公开部署前请运行 `npm run import -- --reset`，确认使用虚构示例。`.gitignore` 只阻止源码提交，不能阻止个人数据被打包进网页；导入私人笔记后的构建产物不可直接公开。

`dist/` 是纯静态文件，可以放到任何静态托管（GitHub Pages、Vercel、Netlify、Cloudflare Pages 等）。构建使用相对路径，部署在子路径下也能正常加载。

## 关于素材

- `public/media/orb.mp4`（发光的光球）和 `jellyfish.mp4`（水母）是看板的核心动效素材，用即梦（Dreamina）AI 生成（AI 生成内容）。可以换成你自己的视频，但请保留光球和水母本身，`npm run verify` 会检查它们。
- 头像 `public/avatar.svg` 是抽象图形，示例数据全部虚构，与任何真实账号无关。

## 它是怎么做出来的

这个界面是用 Claude 一轮一轮对话写出来的，没有一句「万能提示词」。思路很简单：

1. **以原来的看板为起点**：先有一个能用的数据看板和自己的素材，让 AI 在它上面改，而不是从零生成。
2. **先说清楚交互**：光球连着几个模块，点模块展开内容，点内容出现分析。
3. **看一次效果，提一个具体意见**：比如「光球外围再柔和一点」「伞和右侧栏离太远了」，改了十几轮。
4. **让 AI 自己打开浏览器检查**，确认效果对了再进入下一轮。

## License

[PolyForm Noncommercial 1.0.0](LICENSE) · [授权范围、旧版 MIT 与第三方声明](NOTICE.md)
