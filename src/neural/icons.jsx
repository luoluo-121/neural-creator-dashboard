import React from 'react';

const paths = {
  works: 'M4 5h16v14H4ZM4 9h16M9 13l2 2 4-4',
  concept: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  methods: 'M5 4h10l4 4v12H5ZM15 4v4h4M8 12h8M8 16h5',
  idea: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z',
  draft: 'm14 4 6 6M4 20l4-1L20 7a2 2 0 0 0-4-4L4 15ZM12 20h9',
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  back: 'M15 18 9 12l6-6',
  chevron: 'm9 5 7 7-7 7',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  outlink: 'M7 17 17 7M9 7h8v8',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  send: 'M5 12h13M13 6l6 6-6 6',
  search: 'M21 21l-5-5M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z',
  info: 'M12 11v6M12 7h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  replay: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  pause: 'M8 5v14M16 5v14',
  play: 'm8 5 11 7-11 7Z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  agent: 'M12 3a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V7a4 4 0 0 1 4-4ZM10 10h.01M14 10h.01',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'm5 12 4 4L19 6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  save: 'M5 3h14v19l-7-4-7 4Z',
  user: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  grid: 'M4 4h7v7H4ZM13 4h7v7h-7ZM4 13h7v7H4ZM13 13h7v7h-7Z',
  file: 'M6 3h8l4 4v14H6ZM14 3v5h4'
};

export function Icon({name, size = 18, ...props}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.file}/></svg>;
}
