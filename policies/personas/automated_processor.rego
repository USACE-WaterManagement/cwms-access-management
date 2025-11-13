package cwms.personas.automated_processor

import data.cwms.helpers.offices
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    "automated_processor" in input.user.roles
    input.action == "read"
    input.resource == "timeseries"
    input.context.data_source in ["AUTOMATED", "MANUAL"]
}

allow if {
    "automated_processor" in input.user.roles
    input.action in ["create", "update"]
    input.resource == "timeseries"
    input.context.data_source == "CALCULATED"
    input.context.calculation_metadata != null
}
