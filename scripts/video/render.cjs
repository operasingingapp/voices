// render.cjs AUDIO OUT.mp4 : each frame drawn by Chromium (frame.html, setTime), piped to ffmpeg as JPEG
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
(async () => {
  const [audio, out] = process.argv.slice(2);
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]).toString());
  const FPS = 30, N = Math.ceil(dur * FPS), tmp = out + '.part.mp4';
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file:///home/claude/work/video/frame.html'); await p.evaluate(() => document.fonts.ready);
  for (let i = 0; i < N; i++) {
    await p.evaluate((t) => window.setTime(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 900 === 0) console.log(i, '/', N);
  }
  ff.stdin.end(); await b.close();
  ff.on('close', (c) => { if (c === 0) { fs.renameSync(tmp, out); console.log('ok', out); } else console.log('ffmpeg failed', c); });
})();
