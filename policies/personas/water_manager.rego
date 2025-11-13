package cwms.personas.water_manager

import data.cwms.helpers.offices
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    "water_manager" in input.user.roles
    input.action == "read"
    input.resource in ["timeseries", "locations", "forecasts", "models", "scenarios", "ratings", "levels"]
    offices.user_can_access_office(input.user, input.context.office_id)
}

allow if {
    "water_manager" in input.user.roles
    input.action in ["create", "update"]
    input.resource in ["timeseries", "locations", "forecasts", "models", "scenarios"]
    offices.user_can_access_office(input.user, input.context.office_id)
}
