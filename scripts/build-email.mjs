#!/usr/bin/env node
// build-email.mjs — renders data.json into an email-safe HTML newsletter.
// Why: index.html relies on CSS variables, web fonts and a <style> block, which Gmail
// strips, so the mail looked nothing like the site. Email needs inline styles + tables.
// Usage: node scripts/build-email.mjs [data.json] [email.html]

import { readFile, writeFile } from 'node:fs/promises';

const IN = process.argv[2] ?? 'data.json';
const OUT = process.argv[3] ?? 'email.html';
const SITE = 'https://ainews.keramikcenter.com/';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = "font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;";

// "Why it matters: x\nAction: y" -> bold labels, line breaks
function detail(text) {
  if (!text) return '';
  return esc(text).split('\n').map((line) => line.replace(/^([A-Za-z ]{2,20}:)/, '<b>$1</b>')).join('<br>');
}

function sources(list, color) {
  return list.map((s) =>
    `<a href="${esc(s.url)}" style="color:${color};text-decoration:none;font-size:12px;">↗ ${esc(s.name)}</a>` +
    `<span style="color:#9aa0ad;font-size:12px;"> ${esc(s.date)}</span>`).join('&nbsp;&nbsp; ');
}

function item(it, color) {
  const box = it.featured
    ? `background:#ffffff;border:1px solid #dde0e8;border-left:4px solid ${color};border-radius:8px;padding:16px 18px;`
    : 'padding:14px 0;border-top:1px solid #e7e9ef;';
  return `<tr><td style="${box}">
${it.featured ? `<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${color};margin-bottom:8px;">◆ Top story</div>` : ''}
<span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${color};background:${color}1a;padding:2px 7px;border-radius:4px;">${esc(it.tag)}</span>
<div style="font-size:${it.featured ? 20 : 17}px;font-weight:700;line-height:1.3;color:#15171d;margin:8px 0 6px;">${esc(it.headline)}</div>
<div style="font-size:15px;font-weight:600;line-height:1.5;color:#15171d;margin-bottom:6px;">${esc(it.lede)}</div>
${it.detail ? `<div style="font-size:14px;line-height:1.55;color:#5a6070;margin-bottom:8px;">${detail(it.detail)}</div>` : ''}
<div>${sources(it.sources, color)}</div>
</td></tr>`;
}

function lab(l) {
  return `<tr><td style="padding:26px 0 6px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:20px;font-weight:700;color:#15171d;"><span style="color:${l.color};">●</span> ${esc(l.name)}</td>
<td align="right" style="font-size:12px;color:#9aa0ad;">${l.count}</td></tr></table>
</td></tr>${l.items.map((it) => item(it, l.color)).join('\n')}`;
}

// Top-3 and rollout lists (optional; older data.json has neither)
function block(title, list, accent, size, color) {
  if (!list?.length) return '';
  return `<tr><td style="padding-top:22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="background:#ffffff;border:1px solid #dde0e8;border-left:4px solid ${accent};border-radius:8px;padding:14px 18px;">
<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a6070;margin-bottom:8px;">${title}</div>
${list.map((x) => `<div style="font-size:${size}px;line-height:1.5;color:${color};margin-bottom:6px;">• ${esc(x.text)}</div>`).join('')}
</td></tr></table></td></tr>`;
}

const d = JSON.parse(await readFile(IN, 'utf-8'));
const nav = d.labs.map((l) => `<span style="color:${l.color};">●</span> ${esc(l.name)} ${l.count}`).join('&nbsp;&nbsp; ');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Weekly KW ${d.kw}/${d.year}</title></head>
<body style="margin:0;padding:0;background:#fbfbfc;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfbfc;"><tr><td align="center" style="padding:20px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;${FONT}">
<tr><td style="padding-bottom:14px;border-bottom:1px solid #e7e9ef;">
<div style="font-size:26px;font-weight:800;color:#15171d;"><span style="color:#b5512f;">●</span> AI Weekly</div>
<div style="font-size:13px;color:#5a6070;margin-top:4px;">Week ${d.kw} · ${d.year} · <b style="color:#15171d;">${esc(d.period)}</b> · ${d.itemCount} items</div>
<div style="font-size:12px;color:#5a6070;margin-top:10px;line-height:1.8;">${nav}</div>
<div style="font-size:12px;margin-top:8px;"><a href="${SITE}" style="color:#5a6070;">Read on the web</a></div>
</td></tr>
${block('Top 3 for you', d.summary, '#b5512f', 15, '#15171d')}
${block('Coming to Germany', d.rollouts, '#dde0e8', 14, '#5a6070')}
${d.labs.map(lab).join('\n')}
<tr><td style="padding-top:28px;border-top:1px solid #e7e9ef;font-size:11px;color:#9aa0ad;line-height:1.7;">
Written by a weekly Claude routine. Every item rests on a dated source from that week.<br>
<a href="${SITE}" style="color:#9aa0ad;">ainews.keramikcenter.com</a></td></tr>
</table></td></tr></table></body></html>
`;

await writeFile(OUT, html, 'utf-8');
console.log(`[build-email] ${OUT}: KW ${d.kw}/${d.year}, ${d.itemCount} items.`);
