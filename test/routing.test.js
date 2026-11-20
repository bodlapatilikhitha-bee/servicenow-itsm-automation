'use strict';
const test = require('node:test');
const assert = require('node:assert');
const mock = require('./glide-mock');
mock.install({ 'x_portfolio.routing.fallback_group': 'grp_service_desk' });
global.IncidentRoutingUtils = require('../src/IncidentRoutingUtils');
const executeRule = require('../src/br_incident_before_insert');

mock.seed('x_portfolio_routing_rule', [
  { category: 'network', ci_class: 'cmdb_ci_netgear', assignment_group: 'grp_network_core', order: 100 },
  { category: 'network', ci_class: '', assignment_group: 'grp_network_l2', order: 200 },
  { category: 'database', ci_class: '', assignment_group: 'grp_dba', order: 100, active: false }
]);

test('priority matrix follows impact x urgency', () => {
  const u = new IncidentRoutingUtils();
  assert.strictEqual(u.calculatePriority(1, 1), 1);
  assert.strictEqual(u.calculatePriority('2', '2'), 3);
  assert.strictEqual(u.calculatePriority(3, 3), 5);
});

test('invalid impact/urgency falls back to 4 and logs a warning', () => {
  const before = mock.logs.length;
  assert.strictEqual(new IncidentRoutingUtils().calculatePriority(9, 1), 4);
  assert.ok(mock.logs.length > before);
});

test('most specific rule (lowest order) wins', () => {
  const u = new IncidentRoutingUtils();
  assert.strictEqual(u.findAssignmentGroup('network', 'cmdb_ci_netgear'), 'grp_network_core');
  assert.strictEqual(u.findAssignmentGroup('network', 'cmdb_ci_server'), 'grp_network_l2');
});

test('inactive rules are ignored and unknown categories return empty', () => {
  const u = new IncidentRoutingUtils();
  assert.strictEqual(u.findAssignmentGroup('database', ''), '');
  assert.strictEqual(u.findAssignmentGroup('unknown', ''), '');
});

test('business rule routes to fallback group when no rule matches', () => {
  const inc = mock.record({ number: 'INC0010001', impact: 2, urgency: 1, category: 'database' });
  executeRule(inc, null);
  assert.strictEqual(inc.getValue('assignment_group'), 'grp_service_desk');
  assert.strictEqual(inc.getValue('priority'), '2');
});

test('existing assignment group is never overwritten', () => {
  const inc = mock.record({ impact: 1, urgency: 1, category: 'network', assignment_group: 'grp_manual' });
  new IncidentRoutingUtils().route(inc, 'grp_service_desk');
  assert.strictEqual(inc.getValue('assignment_group'), 'grp_manual');
});
