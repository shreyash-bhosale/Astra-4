import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');
const BASE_URL = 'https://astra-4-opal.vercel.app';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capture(page, filename, options = {}) {
  const fullPath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: fullPath, fullPage: options.fullPage || false });
  const stat = fs.statSync(fullPath);
  console.log(`  ✅ [SAVED] ${filename} (${Math.round(stat.size / 1024)} KB)`);
}

async function run() {
  console.log('🚀 Starting ResolveAI Master Screenshot Capture...\n');
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  try {
    // 1. Landing Page Hero & Light
    console.log('📸 1. Capturing Landing Page...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await capture(page, 'landing_page_hero.png');
    await capture(page, 'landing_page_light.png', { fullPage: true });

    // 2. Portal Selection Page
    console.log('\n📸 2. Capturing Portal Selection...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await capture(page, 'login_selection.png');

    // 3. Staff Login Page
    console.log('\n📸 3. Capturing Staff Login Page...');
    await page.goto(`${BASE_URL}/staff/login`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await capture(page, 'login_page.png');

    // 4. Authenticate as Admin via 1-Click Admin
    console.log('\n🔐 Authenticating as Admin...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('1-Click Admin'));
      if (btn) btn.click();
    });
    await sleep(5000);
    console.log(`  Current URL after login: ${page.url()}`);

    // 5. Dashboard Overview
    console.log('\n📸 4. Capturing Dashboard Overview...');
    await capture(page, 'dashboard_overview.png');

    // 6. Agent Fleet Showcase
    console.log('\n📸 5. Capturing Agent Fleet Section...');
    await page.evaluate(() => window.scrollTo({ top: 580, behavior: 'instant' }));
    await sleep(1500);
    await capture(page, 'agent_fleet_showcase.png');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    // 7. Tickets List
    console.log('\n📸 6. Navigating to Tickets List...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('aside a, nav a')).find(l => l.innerText.includes('Tickets'));
      if (link) link.click();
    });
    await sleep(4000);
    await capture(page, 'tickets_list.png');

    // 8. Ticket Workspace (Autonomous Investigation & Resolution)
    console.log('\n📸 7. Opening Ticket Workspace...');
    const clickedWorkspace = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Workspace') || el.textContent.includes('Investigate'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log(`  Clicked Workspace: ${clickedWorkspace}`);
    await sleep(4000);
    console.log(`  Workspace URL: ${page.url()}`);
    await capture(page, 'ticket_workspace_initial.png');
    await capture(page, 'ticket_workspace_resolved.png', { fullPage: true });

    // 9. Human-in-the-Loop Approvals
    console.log('\n📸 8. Navigating to Human Approval Gate...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('aside a, nav a')).find(l => l.innerText.includes('Approvals'));
      if (link) link.click();
    });
    await sleep(4000);
    await capture(page, 'human_approval_gate.png');

    // 10. AI Control Center
    console.log('\n📸 9. Navigating to AI Control Center...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('aside a, nav a')).find(l => l.innerText.includes('AI Control Center'));
      if (link) link.click();
    });
    await sleep(4000);
    await capture(page, 'ai_control_center.png');

    // 11. AI Activity & Audit Log
    console.log('\n📸 10. Navigating to Activity & Audit Log...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('aside a, nav a')).find(l => l.innerText.includes('AI Activity'));
      if (link) link.click();
    });
    await sleep(4000);
    await capture(page, 'activity_audit_log.png');

    // 12. Settings
    console.log('\n📸 11. Navigating to Settings Page...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('aside a, nav a')).find(l => l.innerText.includes('Settings'));
      if (link) link.click();
    });
    await sleep(3000);
    await capture(page, 'settings_page.png');

    // 13. Customer Portal
    console.log('\n🔐 12. Authenticating as Customer...');
    await page.goto(`${BASE_URL}/customer/login`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('1-Click Evaluator') || b.textContent.includes('Customer Sign In'));
      if (btn) btn.click();
    });
    await sleep(5000);
    console.log(`  Customer Portal URL: ${page.url()}`);
    await capture(page, 'customer_portal_home.png');

    // 14. Customer Issues
    console.log('\n📸 13. Customer Issues List...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('nav a, header a')).find(l => l.textContent.includes('My Issues'));
      if (link) link.click();
    });
    await sleep(3500);
    await capture(page, 'customer_issues_list.png');

    // 15. Raise Issue
    console.log('\n📸 14. Customer Raise Issue Form...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('nav a, header a, a')).find(l => l.textContent.includes('Raise Issue'));
      if (link) link.click();
    });
    await sleep(3500);
    await capture(page, 'customer_submit_issue.png');

    // 16. Customer Orders
    console.log('\n📸 15. Customer Orders List...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('nav a, header a, a')).find(l => l.textContent.includes('Orders'));
      if (link) link.click();
    });
    await sleep(3500);
    await capture(page, 'customer_orders.png');

    console.log('\n🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED!\n');
  } catch (err) {
    console.error('❌ Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
