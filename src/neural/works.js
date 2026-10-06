// 作品库数据来自 src/data/sample.js（虚构示例）。
import {posts as samplePosts, postContent} from '../data';

export const posts = samplePosts;
export const workContent = postContent;
// 「本月」以最新一篇作品所在月份为准
const latest = posts.map(p => p.date).sort().pop();
export const monthPosts = posts.filter(p => p.date.slice(0, 7) === latest.slice(0, 7));
