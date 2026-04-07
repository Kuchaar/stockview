#!/usr/bin/env node
// Generates public/og-default.png — 1200x630 placeholder OG image.
// Pure Node.js, no external dependencies (uses built-in zlib).
// Run once: node scripts/generate-og-image.mjs

import { deflateSync } from 'zlib';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'og-default.png');

if (existsSync(OUT)) {
  console.log('✓ public/og-default.png already exists — skipping');
  process.exit(0);
}

const W = 1200;
const H = 630;

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([tb, data]);
  return Buffer.concat([u32(data.length), tb, data, u32(crc32(crcBuf))]);
}

// Build raw pixel data: for each row → filter byte (0) + R,G,B per pixel
const rowBytes = 1 + W * 3;
const raw = Buffer.alloc(H * rowBytes);

for (let y = 0; y < H; y++) {
  const base = y * rowBytes;
  raw[base] = 0; // filter: None

  for (let x = 0; x < W; x++) {
    // Horizontal gradient: #1e293b (slate-800) → #0f172a (slate-900)
    const t = x / (W - 1);
    const r = Math.round(0x1e + (0x0f - 0x1e) * t);
    const g = Math.round(0x29 + (0x17 - 0x29) * t);
    const bv = Math.round(0x3b + (0x2a - 0x3b) * t);
    raw[base + 1 + x * 3] = r;
    raw[base + 1 + x * 3 + 1] = g;
    raw[base + 1 + x * 3 + 2] = bv;
  }
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = pngChunk('IHDR', Buffer.concat([u32(W), u32(H), Buffer.from([8, 2, 0, 0, 0])]));
const idat = pngChunk('IDAT', deflateSync(raw, { level: 9 }));
const iend = pngChunk('IEND', Buffer.alloc(0));

writeFileSync(OUT, Buffer.concat([sig, ihdr, idat, iend]));
console.log(`✓ Generated public/og-default.png (${W}x${H})`);
