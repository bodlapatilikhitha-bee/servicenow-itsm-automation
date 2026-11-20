/**
 * Catalog Client Script: "Validate access request"
 * Type: onSubmit | Applies to: Catalog Item "Application Access (sample)"
 *
 * Blocks submission when the end date is before the start date or the
 * business justification is too short, and shows a field message instead of
 * an alert so the user knows exactly what to fix.
 */
var MIN_JUSTIFICATION = 20;
var MAX_ACCESS_DAYS = 365;

function onSubmit() {
  g_form.clearMessages();
  var start = g_form.getValue('start_date');
  var end = g_form.getValue('end_date');
  var justification = (g_form.getValue('business_justification') || '').trim();
  var ok = true;

  if (start && end) {
    var days = (new Date(end) - new Date(start)) / 86400000;
    if (days < 0) {
      g_form.showFieldMsg('end_date', 'End date must be on or after the start date.', 'error');
      ok = false;
    } else if (days > MAX_ACCESS_DAYS) {
      g_form.showFieldMsg('end_date', 'Access longer than ' + MAX_ACCESS_DAYS + ' days needs a separate exception request.', 'error');
      ok = false;
    }
  }
  if (justification.length < MIN_JUSTIFICATION) {
    g_form.showFieldMsg('business_justification', 'Please describe why you need access (at least ' + MIN_JUSTIFICATION + ' characters).', 'error');
    ok = false;
  }
  return ok;
}

if (typeof module !== 'undefined') { module.exports = onSubmit; }
