#!/usr/bin/env node
// html-to-data.mjs — derives a structured data.json from the generated index.html.
//
// Why: index.html is the human-facing digest (filled _template.html). Downstream
// consumers (e.g. the horde-summit dashboard) need clean structured data, not HTML.
// This parser is deterministic against the FIXED template structure; if the template
// ever changes shape it fails loudly (non-zero exit) so CI catches the drift instead
// of silently shipping an empty/wrong data.json.
//
// Zero runtime dependencies (Node built-ins only) — runs on a bare GitHub runner.
// Usage: node scripts/html-to-data.mjs [inputHtml=index.html] [outputJson=data.json]

import { readFile, writeFile } from 'node:fs/promises';

const IN = process.argv[2] ?? 'index.html';
const OUT = process.argv[3] ?? 'data.json';

const MONTHS = {
  januar: '01', februar: '02', 'märz': '03', maerz: '03', april: '04',
  mai: '05', juni: '06', juli: '07', august: '08', september: '09',
  oktober: '10', november: '11', dezember: '12',
};

/** Decode the handful of HTML entities the template emits. Umlauts are raw UTF-8. */
function decode(s) {
  if (s == null) return s;
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** First capture group of `re` against `text`, decoded; or null. */
function pick(text, re) {
  const m = text.match(re);
  return m ? decode(m[1]) : null;
}

/** "01.06.2026" + "07:00" -> "2026-06-01T07:00:00" (local, no tz). */
function toIso(dateDe, timeDe) {
  const dm = (dateDe ?? '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!dm) return null;
  const [, d, mo, y] = dm;
  const time = /^\d{1,2}:\d{2}$/.test(timeDe ?? '') ? `${timeDe}:00` : '00:00:00';
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${time.padStart(8, '0')}`;
}

function parseSources(block) {
  if (!block) return [];
  const out = [];
  const re = /<a class="src" href="([^"]+)"[^>]*>(.*?)<span class="src-date">(.*?)<\/span><\/a>/gs;
  let m;
  while ((m = re.exec(block)) !== null) {
    out.push({ name: decode(m[2]), url: m[1], date: decode(m[3]) });
  }
  return out;
}

function parseItems(labBlock) {
  const out = [];
  const re = /<article class="(item(?: featured)?)">(.*?)<\/article>/gs;
  let m;
  while ((m = re.exec(labBlock)) !== null) {
    const cls = m[1];
    const body = m[2];
    const numRaw = pick(body, /<div class="inum">(\d+)<\/div>/);
    const sourcesBlock = pick(body, /<div class="sources">(.*?)<\/div>/s);
    out.push({
      num: numRaw ? parseInt(numRaw, 10) : null,
      featured: cls.includes('featured'),
      tag: pick(body, /<span class="tag">(.*?)<\/span>/s),
      headline: pick(body, /<h3>(.*?)<\/h3>/s),
      lede: pick(body, /<p class="lede">(.*?)<\/p>/s),
      detail: pick(body, /<p class="detail">(.*?)<\/p>/s),
      sources: parseSources(sourcesBlock),
    });
  }
  return out;
}

function parse(html) {
  // ── Masthead ──
  const mast = pick(html, /<div class="mast-meta">(.*?)<\/div>/s) ?? '';
  const kwM = html.match(/Kalenderwoche\s+(\d+)\s*·\s*(\d+)/);
  const kw = kwM ? parseInt(kwM[1], 10) : null;
  const year = kwM ? parseInt(kwM[2], 10) : null;
  const period = pick(html, /<div class="mast-meta">[\s\S]*?<b>(.*?)<\/b>/);

  // ── Footer (generated timestamp + prev edition) ──
  const genM = html.match(/Generiert:\s*([\d.]+),\s*([\d:]+)/);
  const generated = genM ? toIso(genM[1], genM[2]) : null;
  const prevHref = pick(html, /<a class="prev-link" href="([^"]+)"/);

  // ── Labs ──
  const labs = [];
  const labRe = /<section class="lab" id="([^"]+)"[^>]*style="([^"]*)"[^>]*>(.*?)<\/section>/gs;
  let lm;
  while ((lm = labRe.exec(html)) !== null) {
    const id = lm[1];
    const color = (lm[2].match(/--c:\s*(#[0-9a-fA-F]+)/) || [])[1] ?? null;
    const block = lm[3];
    const name = pick(block, /<span class="lab-name">(.*?)<\/span>/s);
    const items = parseItems(block);
    labs.push({ id, name, color, count: items.length, items });
  }

  const itemCount = labs.reduce((n, l) => n + l.items.length, 0);
  return {
    schemaVersion: 1,
    kw,
    year,
    period,
    generated,
    prevHref,
    categoryCount: labs.length,
    itemCount,
    labs,
  };
}

const html = await readFile(IN, 'utf-8');
const data = parse(html);

// Fail loudly on a structural break so CI catches template drift.
if (data.labs.length === 0 || data.itemCount === 0) {
  console.error(`[html-to-data] parse yielded ${data.labs.length} labs / ${data.itemCount} items — template drift? Aborting.`);
  process.exit(1);
}

await writeFile(OUT, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`[html-to-data] ${OUT}: KW ${data.kw}/${data.year}, ${data.categoryCount} labs, ${data.itemCount} items.`);
