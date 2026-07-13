import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const logs = [];
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => logs.push(`[PAGEERROR] ${err}`));

await page.addInitScript(() => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('rol', 'admin');
});

await page.goto('http://localhost:3000/ordendeTrabajo/crear', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

console.log('URL:', page.url());
console.log('Logs:');
for (const l of logs) {
  if (l.includes('Ordende') || l.includes('Error') || l.includes('error') || l.includes('PAGEERROR') || l.includes('COMPONENTE')) {
    console.log(l.slice(0, 500));
  }
}

await browser.close();
