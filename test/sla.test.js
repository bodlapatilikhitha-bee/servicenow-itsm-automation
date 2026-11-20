'use strict';
const test = require('node:test');
const assert = require('node:assert');
require('./glide-mock').install();
const SLAEscalationHelper = require('../src/SLAEscalationHelper');
const H = 3600000;

test('percent consumed subtracts paused time', () => {
  const h = new SLAEscalationHelper();
  assert.strictEqual(h.percentConsumed(0, 6 * H, 2 * H, 8 * H), 50);
});

test('zero or negative duration throws', () => {
  assert.throws(() => new SLAEscalationHelper().percentConsumed(0, H, 0, 0));
});

test('escalation levels at 50/75/100 percent', () => {
  const h = new SLAEscalationHelper();
  assert.strictEqual(h.escalationFor(10, 0), null);
  assert.deepStrictEqual(h.escalationFor(50, 0), { level: 1, action: 'notify_assignee' });
  assert.deepStrictEqual(h.escalationFor(80, 1), { level: 2, action: 'notify_group_lead' });
  assert.deepStrictEqual(h.escalationFor(120, 2), { level: 3, action: 'breached_notify_manager' });
});

test('does not repeat an escalation already sent', () => {
  assert.strictEqual(new SLAEscalationHelper().escalationFor(80, 2), null);
});
