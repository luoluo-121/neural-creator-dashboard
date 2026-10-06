// 配色与素材路径：中性深灰底 + 银灰光球 + 黑底发光水母；点缀为银白与香槟金。只放颜色与素材，不含交互。
import {asset} from '../config';

export const T = {
  kinds: {core: '#ecd9a6', folder: '#d9b6c1', post: '#c0b8ef', note: '#a9dccb', idea: '#e8c48c', draft: '#a9d3e4', concept: '#e4e6e8', tag: '#98a6a1', ghost: '#70746f'},
  modules: {
    works: {color: '#c3bcf2', filter: 'hue-rotate(215deg) saturate(1.1)'},
    concepts: {color: '#e2e5e8', filter: 'hue-rotate(185deg) saturate(.3) brightness(1.15)'},
    methods: {color: '#ace0cf', filter: 'hue-rotate(118deg) saturate(1)'},
    ideas: {color: '#ecc98f', filter: 'saturate(1)'},
    drafts: {color: '#acd6e8', filter: 'hue-rotate(158deg) saturate(1.05)'}
  },
  media: {orb: asset('media/orb.mp4'), orbPoster: asset('media/orb.jpg'), jelly: asset('media/jellyfish.mp4'), jellyPoster: asset('media/jellyfish.jpg')},
  pulse: {out: ['#fffaf0', '#ecd39e'], in: ['#ffffff', '#e3b3c4']},
  ring: ['#ecd9a6', '#c9cac5'],
  logo: ['#7d7f7c', '#d8d9d6', '#ecd9a6', '#a9aba7'],
  mini: {glow0: '#ffffff', core: '#c9d6e0', dot: '#f2f4f5', mutual: '#ecd39e', pulseOut: '#ffffff', pulseIn: '#e3b3c4'},
  dust: ['236,236,232', '230,207,152', '200,205,210', '255,255,255'],
  canvas: {additive: true, mutual: '236,206,146', mutualIn: '232,176,196', wiki: '172,224,206', link: '205,208,204', pulseOne: '190,230,215', label: '#e6e7e3', spark: ['200,205,210', '225,228,232', '255,236,200'], glow: '66', light: '#ffffff'}
  };
