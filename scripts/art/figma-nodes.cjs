const fs = require('fs'), pako = require('pako'), fzstd = require('fzstd'), kiwi = require('kiwi-schema');
const d = fs.readFileSync(process.argv[2]);
let o = 12; const chunks = [];
while (o < d.length) { const n = d.readUInt32LE(o); chunks.push(d.subarray(o + 4, o + 4 + n)); o += 4 + n; }
const inflate = (b) => (b[0] === 0x28 && b[1] === 0xb5 ? fzstd.decompress(b) : pako.inflateRaw(b));
const schema = kiwi.compileSchema(kiwi.decodeBinarySchema(inflate(chunks[0])));
const msg = schema.decodeMessage(inflate(chunks[1]));
const hex = (a) => Buffer.from(a).toString('hex');
const id = (g) => `${g.sessionID}:${g.localID}`;
const out = msg.nodeChanges.map(n => ({
  id: id(n.guid), parent: n.parentIndex ? id(n.parentIndex.guid) : null, pos: n.parentIndex?.position, type: n.type, name: n.name, visible: n.visible,
  size: n.size, transform: n.transform, clips: n.frameMaskDisabled === undefined ? undefined : !n.frameMaskDisabled,
  cornerRadius: n.cornerRadius, opacity: n.opacity,
  paints: (n.fillPaints || []).map(f => ({ type: f.type, visible: f.visible, opacity: f.opacity, blend: f.blendMode, hash: f.image ? hex(f.image.hash) : undefined, scale: f.imageScaleMode, t: f.transform, color: f.color, filters: f.paintFilter, scaleF: f.scale, rot: f.rotation })),
}));
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
