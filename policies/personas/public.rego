package cwms.personas.public

import data.cwms.helpers.time_rules
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    input.resource in ["health", "ready", "metrics"]
}

allow if {
    input.action == "read"
    input.resource in ["offices", "units", "parameters", "timezones"]
}

allow if {
    input.action == "read"
    input.resource == "timeseries"
    input.context.classification == "public"
    not time_rules.data_under_ts_group_embargo(input.context, input.user)
}

allow if {
    input.action == "read"
    input.resource == "locations"
    input.context.classification == "public"
}
