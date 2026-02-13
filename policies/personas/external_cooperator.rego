package cwms.personas.external_cooperator

import data.cwms.helpers.offices
import data.cwms.helpers.time_rules
import future.keywords.contains
import future.keywords.if
import future.keywords.in

partnership_active(user) if {
    user.partnership_expiry_ns != null
    user.partnership_expiry_ns > time.now_ns()
}

allow if {
    "external_cooperator" in input.user.roles
    input.action == "read"
    input.resource == "timeseries"
    input.context.parameter in input.user.allowed_parameters
    input.context.classification != "sensitive"
    partnership_active(input.user)
    not time_rules.data_under_ts_group_embargo(input.context, input.user)
}

allow if {
    "external_cooperator" in input.user.roles
    input.action == "create"
    input.resource == "timeseries"
    input.context.parameter in input.user.allowed_parameters
    offices.user_can_access_office(input.user, input.context.office_id)
    partnership_active(input.user)
}
