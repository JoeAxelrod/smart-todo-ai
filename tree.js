#!/usr/bin/env node
// tree.js — directory tree + inline file preview
// • walks to depth 5  • skips bulky dirs
// • prints FULL text for *.js, *.ts, *.tsx, *.yml, Dockerfile, README*

import fs from 'fs';
import path from 'path';

const SKIP_DIR = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache']);
const MAX_DEPTH = 5;
const SHOW_SOURCE = /\.(js|ts|tsx|yml)$/i;
const SHOW_EXACT  = new Set(['Dockerfile', 'README', 'README.md', 'README.txt']);

function tree(dir = '.', depth = 0) {
  if (depth > MAX_DEPTH) return;
  const indent = '  '.repeat(depth);

  for (const entry of fs.readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;

    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    const isDir = stat.isDirectory();

    console.log(`${indent}${isDir ? '📂' : '📄'} ${entry}`);

    if (isDir) {
      tree(full, depth + 1);
    } else if (shouldShow(entry)) {
      const content = fs.readFileSync(full, 'utf8')
        .split('\n')
        .map(l => `${indent}  │ ${l}`)         // indent each source line
        .join('\n');
      console.log(content);
    }
  }
}

function shouldShow(filename) {
  return SHOW_SOURCE.test(filename) || SHOW_EXACT.has(filename);
}

// entry point
tree(process.argv[2] || '.');
