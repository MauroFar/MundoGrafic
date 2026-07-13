import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const failedRequests = [];
page.on('requestfailed', (req) => {
  failedRequests.push({ url: req.url(), err: req.failure()?.errorText });
});
page.on('response', (res) => {
  if (res.status() >= 400 && res.url().includes('ordendeTrabajo')) {
    failedRequests.push({ url: res.url(), status: res.status() });
  }
});

await page.addInitScript(() => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('rol', 'admin');
});

await page.goto(`${BASE}/ordendeTrabajo/crear`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000);

console.log('Final URL:', page.url());
console.log('Failed requests:', JSON.stringify(failedRequests.filter(r => r.url.includes('Ordende') || r.url.includes('ordende')), null, 2));

await browser.close();
