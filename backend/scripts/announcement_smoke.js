const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '../src/server.ts');
const content = fs.readFileSync(serverFile, 'utf8');

const requiredChecks = [
  '/api/system/announcement/stream',
  '/api/system/announcement',
  '/api/system/announcement/vote',
  'event: announcement',
];

for (const check of requiredChecks) {
  if (!content.includes(check)) {
    throw new Error(`Falta la implementación requerida: ${check}`);
  }
}

console.log('Smoke test de anuncio de actualización: OK');
