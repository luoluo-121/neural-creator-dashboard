---
name: neural-creator-dashboard
description: 把用户的 Markdown / Obsidian 笔记和作品数据做成「创作神经网络看板」网页——中心光球、五只发光水母模块、点开后触须伞状展开、右侧分析栏，银灰配色，纯前端本地运行。Use when the user wants a neural-network style creator or knowledge dashboard, wants to visualize Obsidian notes, works metrics and bidirectional links, or mentions neural-creator-dashboard.
license: PolyForm-Noncommercial-1.0.0
metadata:
  repository: https://github.com/luoluo-121/neural-creator-dashboard
  version: "0.2.0"
---

# 创作神经网络看板 · Neural Creator Dashboard

帮用户得到一个属于自己的「创作神经网络看板」：首页是一颗光球和五只代表模块（作品库、概念网络、方法库、选题池、创作台）的发光水母；点开水母，触须伞状展开到每一篇内容；点开一篇，右侧弹出它的数据、出链 / 反链 / 双向共振和二度关联。看板是 React + Vite 纯前端项目，不联网、不调用 AI。

## 使用许可

当前版本按 PolyForm Noncommercial 1.0.0 提供，用于学习、个人非商业使用及协议允许的其他非商业用途；商业使用需要另行授权。不要将本项目描述为 MIT 或无商业限制的开源软件。旧版 MIT 授权及第三方许可继续有效，具体见仓库 LICENSE 和 NOTICE.md。

## 需要的环境

- `git`
- Node.js 20.19+ 或 22.12+（`node -v` 确认）

## 步骤

### 1. 取得项目模板

把模板克隆到用户指定的位置（不要修改这个 skill 自己的文件夹）：

```bash
git clone --depth 1 https://github.com/luoluo-121/neural-creator-dashboard.git neural-dashboard
cd neural-dashboard
npm install
```

没有 git 时，可以从仓库页面下载 ZIP 解压，再执行 `npm install`。

### 2. 先用示例数据跑起来

```bash
npm run dev
```

打开终端里显示的地址（默认 http://127.0.0.1:5173/ ）。确认首页出现光球和五只水母后，再进行下一步。仓库里的示例数据全部是虚构的。

### 3. 导入用户自己的笔记

先问用户笔记文件夹的路径（例如 Obsidian 仓库），**得到同意后**再读取。导入脚本只读不写、不联网：

```bash
npm run import -- --vault "<笔记文件夹>" --account "<账号名>" --followers <粉丝数>
```

- 按文件夹名自动识别：名字含「作品 / works」的是作品，「方法 / 模板 / 流程 / methods / templates」的是方法笔记，「选题 / ideas」的是选题，「草稿 / 创作台 / drafts」的是草稿。识别不准时用 `--works <文件夹>`、`--methods`、`--ideas`、`--drafts` 指定（相对笔记文件夹的路径，可多次传）。
- 作品的数据写在 frontmatter 里，中英文字段都认：`观看/views`、`点赞/likes`、`评论/comments`、`收藏/saves`、`涨粉/follows`、`分享/shares`、`曝光/impressions`、`封面点击率/ctr`、`平均观看时长/duration`、`发布时间/date`、`类型/media`（视频 / 图文）、`tags`；支持「1.2万」「12.4%」「21s」这类写法。
- 正文里的 `[[双链]]` 会自动连线；同一个话题标签出现在两条以上内容里，会成为「概念」节点。
- 格式参考 `examples/vault/`。可以先运行 `npm run import -- --vault examples/vault` 看效果。
- 导入后数据写入 `src/data/my-data.js`，看板自动改读它；`npm run import -- --reset` 切回示例数据。

用户的数据不是 Markdown（比如表格）时，按 `src/data/sample.js` 的字段手写 `src/data/my-data.js`，再把 `src/data/index.js` 改成 `export * from './my-data.js';`。

### 4. 个性化

- `src/config.js`：品牌名、图谱中心的名字、头像（放进 `public/`）、页脚文字。
- `src/neural/theme.js` 与 `src/neural/neural.css` 顶部的 CSS 变量：配色。
- `public/media/`：光球与水母视频，可以换成用户自己的素材（保持文件名，或同步修改 `theme.js` 里的路径）。

### 5. 验证

```bash
npm run verify
npm run build
```

两条命令都应通过。再在浏览器里确认：首页有光球和五只水母；点「作品库」水母，触须伞状展开；点其中一篇，右侧弹出分析栏；浏览器控制台没有报错。

### 6. 部署（可选）

`npm run build` 生成的 `dist/` 是纯静态文件，可以放到任何静态托管。

## 注意

- 发光的光球和五只水母是这个看板的核心动效，个性化时可以换视频素材或颜色，但不要删除、隐藏或改成静态图片；改完运行 `npm run verify` 确认核心动效检查通过。
- `src/data/my-data.js` 含用户的个人笔记，已写进 `.gitignore`。不要提交或公开部署它，除非用户明确要求。
- 选题、草稿、目标只保存在浏览器 localStorage；换了数据但页面还显示旧的选题和草稿时，改 `src/config.js` 里的 `storagePrefix` 或清空该站点的 localStorage。
- 不要往项目里加联网请求或 AI 调用；图谱分析是本地规则。
- 更多开发约定见项目根目录的 `AGENTS.md`。
