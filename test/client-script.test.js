'use strict';
const test = require('node:test');
const assert = require('node:assert');
const onSubmit = require('../src/cs_catalog_validate_access_request');

function form(values) {
  const msgs = [];
  global.g_form = {
    clearMessages: () => {},
    getValue: f => values[f] || '',
    showFieldMsg: (f, m) => msgs.push(f)
  };
  return msgs;
}

test('valid request submits', () => {
  const msgs = form({ start_date: '2026-01-01', end_date: '2026-03-01', business_justification: 'Need read access for quarterly audit work' });
  assert.strictEqual(onSubmit(), true);
  assert.deepStrictEqual(msgs, []);
});

test('end before start is blocked', () => {
  const msgs = form({ start_date: '2026-03-01', end_date: '2026-01-01', business_justification: 'Need read access for quarterly audit work' });
  assert.strictEqual(onSubmit(), false);
  assert.deepStrictEqual(msgs, ['end_date']);
});

test('short justification and over-long access are both reported', () => {
  const msgs = form({ start_date: '2026-01-01', end_date: '2027-06-01', business_justification: 'need it' });
  assert.strictEqual(onSubmit(), false);
  assert.deepStrictEqual(msgs.sort(), ['business_justification', 'end_date']);
});
