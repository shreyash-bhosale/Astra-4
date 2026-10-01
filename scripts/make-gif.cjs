const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const GIFEncoder = require('gif-encoder-2');

const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

const filesToInclude = [
  'landing_page_dark.png',
  'landing_page_light.png',
  'agent_fleet_showcase.png',
  'login_page.png',
  'dashboard_overview.png',
  'ticket_workspace_initial.png',
  'ticket_workspace_paused_gate.png',
  'human_approval_gate.png',
  'ticket_workspace_resolved.png'
];

async function createGif() {
  console.log('🎬 Reading PNG screenshots and encoding GIF...');
  const firstBuf = fs.readFileSync(path.join(SCREENSHOT_DIR, filesToInclude[0]));
  const firstPng = PNG.sync.read(firstBuf);

  // Downsample to 960x600 for high quality & fast loading
  const targetW = 960;
  const targetH = Math.round((firstPng.height / firstPng.width) * targetW);

  console.log(`Target GIF resolution: ${targetW}x${targetH}`);

  const encoder = new GIFEncoder(targetW, targetH, 'neuquant', true);
  const gifPath = path.join(SCREENSHOT_DIR, 'resolveai-demo-walkthrough.gif');
  const writeStream = fs.createWriteStream(gifPath);
  encoder.createReadStream().pipe(writeStream);

  encoder.start();
  encoder.setRepeat(0); // Infinite loop
  encoder.setDelay(2200); // 2.2 seconds per frame
  encoder.setQuality(10); // High quality

  for (let i = 0; i < filesToInclude.length; i++) {
    const filename = filesToInclude[i];
    const fullPath = path.join(SCREENSHOT_DIR, filename);
    const buf = fs.readFileSync(fullPath);
    const png = PNG.sync.read(buf);

    const scaleX = png.width / targetW;
    const scaleY = png.height / targetH;

    const scaledBuf = Buffer.alloc(targetW * targetH * 4);
    for (let y = 0; y < targetH; y++) {
      const srcY = Math.min(png.height - 1, Math.floor(y * scaleY));
      for (let x = 0; x < targetW; x++) {
        const srcX = Math.min(png.width - 1, Math.floor(x * scaleX));
        const srcIdx = (png.width * srcY + srcX) << 2;
        const dstIdx = (targetW * y + x) << 2;
        scaledBuf[dstIdx] = png.data[srcIdx];
        scaledBuf[dstIdx + 1] = png.data[srcIdx + 1];
        scaledBuf[dstIdx + 2] = png.data[srcIdx + 2];
        scaledBuf[dstIdx + 3] = png.data[srcIdx + 3];
      }
    }

    encoder.addFrame(scaledBuf);
    console.log(`✓ Added frame ${i + 1}/${filesToInclude.length}: ${filename}`);
  }

  encoder.finish();
  await new Promise(resolve => writeStream.on('finish', resolve));

  const stats = fs.statSync(gifPath);
  console.log(`\n🎉 Success! Demo Walkthrough GIF generated:`);
  console.log(`📁 ${gifPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

createGif().catch(err => {
  console.error('GIF encoding error:', err);
  process.exit(1);
});
