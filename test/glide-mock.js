// Minimal in-memory stand-ins for ServiceNow globals so Script Includes can
// be unit tested with Node's built-in test runner. Only the APIs these
// examples use are implemented.
'use strict';

const db = {};
const logs = [];

class GlideRecord {
  constructor(table) { this.table = table; this._filters = []; this._order = null; this._rows = []; this._i = -1; this._values = {}; }
  addActiveQuery() { this._filters.push(r => r.active !== false); }
  addQuery(field, value) { this._filters.push(r => r[field] === value); }
  orderBy(field) { this._order = field; }
  query() {
    let rows = (db[this.table] || []).filter(r => this._filters.every(f => f(r)));
    if (this._order) rows = rows.slice().sort((a, b) => a[this._order] - b[this._order]);
    this._rows = rows; this._i = -1;
  }
  next() { this._i += 1; if (this._i < this._rows.length) { this._values = this._rows[this._i]; return true; } return false; }
  getValue(f) { const v = this._values[f]; return v === undefined || v === null ? '' : String(v); }
  setValue(f, v) { this._values[f] = v; }
}

function install(properties = {}) {
  global.Class = { create: () => function () { this.initialize.apply(this, arguments); } };
  global.GlideRecord = GlideRecord;
  global.gs = {
    warn: m => logs.push(['warn', m]),
    error: m => logs.push(['error', m]),
    info: m => logs.push(['info', m]),
    getProperty: (k, d) => (k in properties ? properties[k] : d)
  };
}

function seed(table, rows) { db[table] = rows; }
function record(values) { const r = new GlideRecord('incident'); r._values = { ...values }; return r; }

module.exports = { install, seed, record, logs, GlideRecord };
