/**
 * SLAEscalationHelper — Script Include used by a scheduled job or Flow
 * Designer action to decide whether an open task needs escalation, based on
 * the percentage of its SLA already consumed.
 *
 * Portfolio example on synthetic data.
 */
var SLAEscalationHelper = Class.create();

SLAEscalationHelper.THRESHOLDS = [
  { pct: 100, level: 3, action: 'breached_notify_manager' },
  { pct: 75, level: 2, action: 'notify_group_lead' },
  { pct: 50, level: 1, action: 'notify_assignee' }
];

SLAEscalationHelper.prototype = {
  initialize: function () {},

  /** Percent of SLA consumed, capped to 0..999, rounded to 1 decimal. */
  percentConsumed: function (startMs, nowMs, pausedMs, durationMs) {
    if (!durationMs || durationMs <= 0) { throw new Error('durationMs must be > 0'); }
    var elapsed = Math.max(0, nowMs - startMs - (pausedMs || 0));
    var pct = (elapsed / durationMs) * 100;
    return Math.min(999, Math.round(pct * 10) / 10);
  },

  /** Returns { level, action } or null when no escalation is due. */
  escalationFor: function (pct, currentLevel) {
    var t = SLAEscalationHelper.THRESHOLDS;
    for (var i = 0; i < t.length; i++) {
      if (pct >= t[i].pct) {
        // Only escalate upward; never repeat a level already sent.
        return t[i].level > (currentLevel || 0) ? { level: t[i].level, action: t[i].action } : null;
      }
    }
    return null;
  },

  type: 'SLAEscalationHelper'
};

if (typeof module !== 'undefined') { module.exports = SLAEscalationHelper; }
