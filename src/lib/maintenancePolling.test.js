import test from 'node:test';
import assert from 'node:assert/strict';
import { MAINTENANCE_POLL_INTERVAL_MS, shouldPollForMaintenance } from './maintenancePolling.js';

test('maintenance status should not poll continuously in the browser', () => {
  assert.equal(MAINTENANCE_POLL_INTERVAL_MS, 0);
  assert.equal(shouldPollForMaintenance(), false);
});
