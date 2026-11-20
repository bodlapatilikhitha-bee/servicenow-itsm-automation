/**
 * Business Rule: "Route new incident"
 * Table: incident | When: before | Insert: true | Order: 100
 * Condition: current.assignment_group.nil() || current.priority.changes()
 *
 * Keeps the rule thin; the logic lives in the Script Include so it can be
 * unit tested and reused from Flow Designer.
 */
function executeRule(current, previous /* null when async */) {
  var SERVICE_DESK_PROPERTY = 'x_portfolio.routing.fallback_group';
  var fallback = gs.getProperty(SERVICE_DESK_PROPERTY, '');
  try {
    new IncidentRoutingUtils().route(current, fallback);
  } catch (e) {
    gs.error('Route new incident failed for ' + current.getValue('number') + ': ' + e.message);
  }
}

if (typeof module !== 'undefined') { module.exports = executeRule; }
