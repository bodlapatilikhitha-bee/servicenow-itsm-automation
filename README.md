# ServiceNow ITSM Automation Examples

Server- and client-side ServiceNow scripts for common ITSM automation problems, written as testable Script Includes with thin Business Rules and Client Scripts on top. Each script has unit tests that run outside a ServiceNow instance.

> **Portfolio project.** Everything here was written from scratch for this repository and uses synthetic data. It is not code from any employer or client instance, and it contains no customer configuration.

## Problems these scripts solve

| Script | Type | Business problem |
|---|---|---|
| `IncidentRoutingUtils` | Script Include | Incidents land in the wrong queue and priority is set inconsistently. Routing is driven by a rule table (category + CI class + order), and priority comes from the ITIL impact × urgency matrix. |
| `br_incident_before_insert` | Business Rule (before insert) | Keeps routing logic out of the rule body, logs failures with the incident number, and falls back to a system-property service desk group. |
| `SLAEscalationHelper` | Script Include | Escalations fire late or repeat. Calculates SLA % consumed (excluding paused time) and returns the next escalation level only once (50% → assignee, 75% → group lead, 100% → manager). |
| `cs_catalog_validate_access_request` | Catalog Client Script (onSubmit) | Access requests arrive with impossible dates or empty justifications. Validates dates, caps access length, and shows field-level messages. |

## How it fits together

```
Incident insert ──▶ Business Rule (before) ──▶ IncidentRoutingUtils.route()
                                                ├─ calculatePriority(impact, urgency)
                                                └─ findAssignmentGroup(category, ciClass)
                                                       └─ GlideRecord on x_portfolio_routing_rule

Scheduled job / Flow action ──▶ SLAEscalationHelper.percentConsumed() ──▶ escalationFor()

Catalog item submit ──▶ onSubmit() client validation ──▶ g_form.showFieldMsg()
```

## Run the tests

Requires Node.js 18 or later. No dependencies to install.

```bash
npm test
```

`test/glide-mock.js` provides minimal in-memory versions of `GlideRecord`, `gs`, `Class.create` and `g_form`, so the same files can be pasted into a ServiceNow instance unchanged (the `module.exports` guard is ignored there).

## Using the scripts in a personal developer instance (PDI)

1. Create a scoped application (for example `x_portfolio`) in ServiceNow Studio.
2. Create a table `x_portfolio_routing_rule` with fields `category` (string), `ci_class` (string), `assignment_group` (reference to `sys_user_group`), `order` (integer) and `active` (true/false).
3. Create the two Script Includes and paste the files from `src/`.
4. Create the Business Rule on `incident` (before, insert, order 100) and call `executeRule(current, previous)`.
5. Create the system property `x_portfolio.routing.fallback_group` with the sys_id of your service desk group.
6. Add the Catalog Client Script to a test catalog item with `start_date`, `end_date` and `business_justification` variables.

## Design choices

- **Logic in Script Includes, not Business Rules** — easier to unit test and reuse from Flow Designer actions.
- **Configuration over code** — routing rules live in a table, so the service desk can change them without a deployment.
- **Fail safe** — invalid input logs a warning and falls back to a sensible default instead of throwing during insert.
- **No duplicate notifications** — escalation only moves upward.

## Security notes

- No credentials, instance URLs or sys_ids from real systems are included.
- In a real instance, protect the routing-rule table with ACLs so only ITSM admins can edit it.

## Limitations and next steps

- The Glide mock implements only the methods used here.
- Next: add an ATF (Automated Test Framework) suite, and a Flow Designer action wrapper for `SLAEscalationHelper`.

## License

MIT — see `LICENSE`.
