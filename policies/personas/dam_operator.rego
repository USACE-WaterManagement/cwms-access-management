package cwms.personas.dam_operator

import data.cwms.helpers.offices
import data.cwms.helpers.time_rules
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    "dam_operator" in input.user.roles
    input.action == "read"
    input.resource in ["timeseries", "measurements", "levels", "gates", "locations"]
    offices.user_can_access_office(input.user, input.context.office_id)
}

allow if {
    "dam_operator" in input.user.roles
    input.action == "create"
    input.resource in ["timeseries", "measurements"]
    input.context.data_source == "MANUAL"
    offices.user_can_access_office(input.user, input.context.office_id)
    time_rules.within_shift_hours(input.user)
}

allow if {
    "dam_operator" in input.user.roles
    input.action == "update"
    input.resource in ["timeseries", "measurements"]
    input.context.data_source == "MANUAL"
    offices.user_can_access_office(input.user, input.context.office_id)
    time_rules.within_shift_hours(input.user)
    time_rules.within_modification_window(input.context, input.user)
}
