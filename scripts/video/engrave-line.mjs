// vt-score.mjs ID XMLPART OUT.svg OUT.json : one singer's line as a single long system, and each note's x against its quarter position
import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';
import fs from 'fs';
const [id, part, outSvg, outJson] = process.argv.slice(2);
let xml = fs.readFileSync(`/home/claude/voices/content/pieces/${id}/score.musicxml`, 'utf8');
// keep only the one part
xml = xml.replace(/<score-part id="([^"]+)"[\s\S]*?<\/score-part>/g, (m, p) => (p === part ? m : ''))
  .replace(/<part id="([^"]+)">[\s\S]*?<\/part>/g, (m, p) => (p === part ? m : ''))
  .replace(/<credit\b[\s\S]*?<\/credit>/g, '').replace(/<movement-title>[\s\S]*?<\/movement-title>/g, '').replace(/<work>[\s\S]*?<\/work>/g, '')
  .replace(/(<text>[^<]*?)\.{2,}(<\/text>)/g, '$1$2').replace(/(<text>[^<]*?)\.{2,}(<\/text>)/g, '$1$2')
  .replace(/<part-name>[^<]*<\/part-name>/g, '<part-name></part-name>').replace(/<part-abbreviation>[^<]*<\/part-abbreviation>/g, '<part-abbreviation></part-abbreviation>')
  .replace(/<creator\b[^>]*>[\s\S]*?<\/creator>/g, '').replace(/<part-group[^>]*\/>/g, '');
const tk = new VerovioToolkit(await createVerovioModule());
tk.setOptions({ breaks: 'none', adjustPageHeight: true, header: 'none', footer: 'none', scale: 100, font: 'Leland', pageMarginTop: 60, pageMarginBottom: 40, pageMarginLeft: 40, pageMarginRight: 200, lyricSize: 4.6, lyricElision: 'unicode', spacingLinear: 0.28, spacingNonLinear: 0.6, mnumInterval: 1, svgViewBox: false,
  svgCss: "g.verse text{font-family:'Charis SIL',serif} g.mNum text{font-family:'Charis SIL',serif;font-style:italic;fill:#8a847a}" });
tk.loadData(xml);
const svg = tk.renderToSVG(1);
fs.writeFileSync(outSvg, svg);
const tm = tk.renderToTimemap({ includeMeasures: true });
// note x from the svg: the notehead's <use x="..">
const xs = {};
for (const m of svg.matchAll(/<g id="([^"]+)" class="note"[^>]*>[\s\S]*?<g class="notehead"[^>]*>\s*<use[^>]*x="([\d.]+)"/g)) xs[m[1]] = +m[2];
const pts = [];
for (const e of tm) for (const nid of e.on ?? []) if (xs[nid] !== undefined) pts.push([e.qstamp, xs[nid], nid]);
const meas = [];
for (const e of tm) if (e.measureOn) meas.push([e.qstamp, e.measureOn]);
const w = +/width="(\d+)px"/.exec(svg)[1], h = +/height="(\d+)px"/.exec(svg)[1];
fs.writeFileSync(outJson, JSON.stringify({ w, h, pts, meas }));
console.log('w', w, 'h', h, 'notes', pts.length);
