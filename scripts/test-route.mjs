import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const alerts = [];
const consoleErrors = [];

page.on('dialog', async (dialog) => {
  alerts.push(dialog.message());
  await dialog.dismiss();
});
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(String(err)));

await page.addInitScript(() => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('rol', 'admin');
});

const routes = [
  '/ordendeTrabajo/ver',
  '/ordendeTrabajo/crear',
  '/test-ruta',
  '/cotizaciones/ver',
];

for (const route of routes) {
  alerts.length = 0;
  consoleErrors.length = 0;
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  const bodyText = await page.locator('body').innerText();
  const hasAlert = alerts.some((a) => a.includes('construcción'));
  const hasOrdenForm = bodyText.includes('Orden de Trabajo') || bodyText.includes('Selecciona el tipo de orden');
  const hasTestRoute = bodyText.includes('ROUTE TEST COMPONENT');
  console.log(JSON.stringify({
    route,
    url: page.url(),
    hasAlert,
    alertMsg: alerts[0] || null,
    hasOrdenForm,
    hasTestRoute,
    consoleErrors: consoleErrors.slice(0, 3),
    bodySnippet: bodyText.slice(0, 250).replace(/\n/g, ' '),
  }, null, 2));
}

await browser.close();
