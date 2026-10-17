#!/usr/bin/env node
// Prerenders the full subject grid into index.html so crawlers (and no-JS
// clients) get complete content on first load, instead of relying on
// client-side rendering of data.js. Run after any change to data.js:
//
//   node tools/prerender.mjs
//
// app.js still renders client-side for every *filtered* view; it skips the
// initial render when the page loads with no filters applied, so it reuses
// this prerendered markup instead of discarding and rebuilding it.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SUJETS } from "../data.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TINTS = { ai: "#E01D8C", agents: "#B0177F", devops: "#8A1B85", cyber: "#6B1E86", data: "#4A1A6E" };

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardHtml(s) {
  return `<div class="card">
      <div class="card-top">
        <div class="card-id">${escapeHtml(s.id)}</div>
        <div class="card-domain" style="background:${TINTS[s.domain] || "#6B1E86"}">${escapeHtml(s.domainLabel)}</div>
      </div>
      <div class="card-title">${escapeHtml(s.title)}</div>
      <div class="card-stack">${escapeHtml(s.stack)}</div>
      <div class="card-meta">
        <div class="pill">${escapeHtml(s.type)}</div>
        <div class="pill">${escapeHtml(String(s.months))} mois</div>
      </div>
    </div>`;
}

const gridHtml = SUJETS.map(cardHtml).join("\n    ");
const count = SUJETS.length;

const indexPath = join(ROOT, "index.html");
let html = readFileSync(indexPath, "utf8");

// Keep every static "N sujets de PFE" / "Catalogue de N sujets" mention (title,
// meta description, OG/Twitter tags, JSON-LD) in sync with the real count.
// The <h1> count itself is set client-side by app.js at runtime.
html = html.replace(/\b\d{2,6}(?= sujets de PFE)/g, String(count));
html = html.replace(/(Catalogue de )\d{2,6}( sujets de PFE)/g, `$1${count}$2`);

const START = "<!--PRERENDERED_CARDS_START-->";
const END = "<!--PRERENDERED_CARDS_END-->";
const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  console.error(`Could not find ${START} ... ${END} markers in index.html — aborting.`);
  process.exit(1);
}
const updated =
  html.slice(0, startIdx + START.length) +
  `\n    ${gridHtml}\n    ` +
  html.slice(endIdx);

writeFileSync(indexPath, updated);
console.log(`Prerendered ${count} cards into index.html (${(updated.length / 1024).toFixed(0)} KB total).`);

// Single real URL (filters are query-string views of the same canonical page),
// so the sitemap is just that one entry with today's build date.
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sujetpfe.subul.uk/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
writeFileSync(join(ROOT, "sitemap.xml"), sitemap);
console.log(`Wrote sitemap.xml (lastmod ${today}).`);
