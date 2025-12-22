package cwms.personas.public

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
}

allow if {
    input.action == "read"
    input.resource == "locations"
    input.context.classification == "public"
}
