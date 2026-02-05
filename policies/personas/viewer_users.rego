package cwms.personas.viewer_users

import data.cwms.helpers.offices
import data.cwms.helpers.time_rules
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    "Viewer Users" in input.user.roles
    input.action == "read"
    input.resource in ["offices", "units", "parameters", "timezones"]
}

allow if {
    "Viewer Users" in input.user.roles
    input.action == "read"
    input.resource in ["timeseries", "locations", "levels"]
    offices.user_can_access_office(input.user, input.context.office_id)
    not time_rules.data_under_ts_group_embargo(input.context, input.user)
}
