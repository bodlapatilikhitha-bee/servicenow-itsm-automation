/**
 * IncidentRoutingUtils — Script Include (server-side, scoped-app style).
 *
 * Decides the assignment group and priority for a new Incident from a
 * data-driven rule table instead of hard-coded if/else chains, so routing
 * changes are configuration, not code.
 *
 * Portfolio example written from scratch on synthetic data. Not taken from
 * any employer or client instance.
 */
var IncidentRoutingUtils = Class.create();

// ITIL impact/urgency -> priority matrix (1 = High, 3 = Low).
IncidentRoutingUtils.PRIORITY_MATRIX = {
  '1-1': 1, '1-2': 2, '1-3': 3,
  '2-1': 2, '2-2': 3, '2-3': 4,
  '3-1': 3, '3-2': 4, '3-3': 5
};

IncidentRoutingUtils.prototype = {
  initialize: function (ruleTable) {
    this.ruleTable = ruleTable || 'x_portfolio_routing_rule';
  },

  /** Returns 1-5 from impact and urgency (strings or numbers, 1-3). */
  calculatePriority: function (impact, urgency) {
    var key = parseInt(impact, 10) + '-' + parseInt(urgency, 10);
    var p = IncidentRoutingUtils.PRIORITY_MATRIX[key];
    if (!p) {
      gs.warn('IncidentRoutingUtils: invalid impact/urgency ' + key + ', defaulting to 4');
      return 4;
    }
    return p;
  },

  /**
   * Finds the first active rule (ordered by `order`) whose category and,
   * optionally, CI class match. Returns the group sys_id or '' when nothing
   * matches, so the caller can fall back to the service desk.
   */
  findAssignmentGroup: function (category, ciClass) {
    var rule = new GlideRecord(this.ruleTable);
    rule.addActiveQuery();
    rule.addQuery('category', category);
    rule.orderBy('order');
    rule.query();
    while (rule.next()) {
      var ruleClass = rule.getValue('ci_class');
      if (!ruleClass || ruleClass === ciClass) {
        return rule.getValue('assignment_group');
      }
    }
    return '';
  },

  /** Applies priority and group to an incident GlideRecord (before insert). */
  route: function (incidentGr, fallbackGroup) {
    incidentGr.setValue('priority',
      this.calculatePriority(incidentGr.getValue('impact'), incidentGr.getValue('urgency')));
    if (!incidentGr.getValue('assignment_group')) {
      var ciClass = incidentGr.getValue('cmdb_ci_class') || '';
      var group = this.findAssignmentGroup(incidentGr.getValue('category'), ciClass);
      incidentGr.setValue('assignment_group', group || fallbackGroup);
    }
    return incidentGr;
  },

  type: 'IncidentRoutingUtils'
};

if (typeof module !== 'undefined') { module.exports = IncidentRoutingUtils; }
