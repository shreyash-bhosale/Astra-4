const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { PNG } = require('pngjs');
const GIFEncoder = require('gif-encoder-2');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const frames = [];

  async function snap(name) {
    const filePath = path.join(SCREENSHOT_DIR, name);
    await page.screenshot({ path: filePath });
    console.log(`📸 Saved screenshot: ${name}`);
  }

  async function recordFrame() {
    // Capture for animated demo at 960x600 for optimal GIF performance
    const buf = await page.screenshot({ encoding: 'binary' });
    frames.push(buf);
  }

  try {
    // 1. Reset demo seeds first
    console.log('Resetting demo seed data...');
    try {
      await fetch('http://localhost:5001/api/reset', { method: 'POST' });
    } catch (e) {}

    // 2. Landing Page - Dark Mode
    console.log('Navigating to Landing Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await snap('landing_page_dark.png');
    await recordFrame();

    // 3. Landing Page - Light Mode
    console.log('Toggling to Light Mode...');
    const themeBtn = await page.$('.theme-toggle-btn');
    if (themeBtn) {
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await snap('landing_page_light.png');
      await recordFrame();
      // Toggle back to dark mode
      await themeBtn.click();
      await new Promise(r => setTimeout(r, 800));
      await recordFrame();
    }

    // 4. Scroll down landing page to show Agent Fleet
    await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'smooth' }));
    await new Promise(r => setTimeout(r, 1200));
    await snap('agent_fleet_showcase.png');
    await recordFrame();

    // 5. Navigate to Login Page
    console.log('Navigating to Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    await snap('login_page.png');
    await recordFrame();

    // 6. Click Sarah Connor Demo Login
    console.log('Clicking Sarah Connor 1-Click Persona Login...');
    const demoBtns = await page.$$('button[type="button"]');
    for (const btn of demoBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Sarah Connor')) {
        await btn.click();
        break;
      }
    }
    await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    // 7. Dashboard Overview
    console.log('Capturing Dashboard Overview...');
    await snap('dashboard_overview.png');
    await recordFrame();

    // 8. Open Case #tkt-001
    console.log('Navigating to Ticket Workspace #tkt-001...');
    await page.goto('http://localhost:5173/tickets/tkt-001', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await snap('ticket_workspace_initial.png');
    await recordFrame();

    // 9. Click "Run ResolveAI" button
    console.log('Triggering Run ResolveAI workflow on #tkt-001...');
    const runBtn = await page.$('button.btn-primary');
    if (runBtn) {
      await runBtn.click();
      // Wait for multi-agent reasoning to pause at Human Approval Gate
      console.log('Waiting for agents to pause at approval gate...');
      await new Promise(r => setTimeout(r, 4500));
      await snap('ticket_workspace_paused_gate.png');
      await recordFrame();
    }

    // 10. Approvals Page
    console.log('Navigating to Approvals Queue...');
    await page.goto('http://localhost:5173/approvals', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await snap('human_approval_gate.png');
    await recordFrame();

    // 11. Authorize action
    console.log('Authorizing action...');
    const approveBtn = await page.$('button.btn-primary');
    if (approveBtn) {
      await approveBtn.click();
      await new Promise(r => setTimeout(r, 4000));
      await recordFrame();
    }

    // 12. Return to Ticket #tkt-001 to show resolved state
    console.log('Returning to resolved ticket...');
    await page.goto('http://localhost:5173/tickets/tkt-001', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await snap('ticket_workspace_resolved.png');
    await recordFrame();

    console.log(`\n✅ Successfully captured ${fs.readdirSync(SCREENSHOT_DIR).length} screenshots!`);

    // 13. Build Animated Demo Walkthrough GIF
    if (frames.length > 0) {
      console.log(`\n🎬 Encoding ${frames.length} keyframes into animated demo walkthrough GIF...`);
      const gifPath = path.join(SCREENSHOT_DIR, 'resolveai-demo-walkthrough.gif');
      
      // Parse first frame to get dimensions
      const firstPng = PNG.sync.read(frames[0]);
      const width = firstPng.width;
      const height = firstPng.height;

      // Scale down to 960 width for optimal git/github file size
      const scale = 0.5;
      const targetW = Math.round(width * scale);
      const targetH = Math.round(height * scale);

      const encoder = new GIFEncoder(targetW, targetH, 'neuquant', true);
      const writeStream = fs.createWriteStream(gifPath);
      encoder.createReadStream().pipe(writeStream);

      encoder.start();
      encoder.setRepeat(0); // Loop forever
      encoder.setDelay(1800); // 1.8 seconds per keyframe
      encoder.setQuality(15);

      for (let i = 0; i < frames.length; i++) {
        const png = PNG.sync.read(frames[i]);
        // Bilinear downsample to targetW x targetH
        const scaledBuf = Buffer.alloc(targetW * targetH * 4);
        for (let y = 0; y < targetH; y++) {
          const srcY = Math.floor(y / scale);
          for (let x = 0; x < targetW; x++) {
            const srcX = Math.floor(x / scale);
            const srcIdx = (png.width * srcY + srcX) << 2;
            const dstIdx = (targetW * y + x) << 2;
            scaledBuf[dstIdx] = png.data[srcIdx];
            scaledBuf[dstIdx + 1] = png.data[srcIdx + 1];
            scaledBuf[dstIdx + 2] = png.data[srcIdx + 2];
            scaledBuf[dstIdx + 3] = png.data[srcIdx + 3];
          }
        }
        encoder.addFrame(scaledBuf);
        process.stdout.write(`Encoded frame ${i + 1}/${frames.length}\r`);
      }

      encoder.finish();
      await new Promise(r => writeStream.on('finish', r));
      console.log(`\n🎉 Animated demo video GIF generated: docs/screenshots/resolveai-demo-walkthrough.gif (${(fs.statSync(gifPath).size / 1024 / 1024).toFixed(2)} MB)`);
    }

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
