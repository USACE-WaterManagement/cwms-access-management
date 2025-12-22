package cwms.personas.automated_collector

import data.cwms.helpers.offices
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    "automated_collector" in input.user.roles
    input.action == "create"
    input.resource == "timeseries"
    input.context.data_source == "AUTOMATED"
    offices.user_can_access_office(input.user, input.context.office_id)
    input.user.auth_method == "api_key"
}
