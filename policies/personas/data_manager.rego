package cwms.personas.data_manager

import data.cwms.helpers.offices
import future.keywords.contains
import future.keywords.if
import future.keywords.in

allow if {
    "data_manager" in input.user.roles
    input.action in ["read", "create", "update"]
    input.resource in ["timeseries", "locations", "catalogs", "ratings", "measurements", "levels"]
    offices.user_can_access_office(input.user, input.context.office_id)
}

allow if {
    "data_manager" in input.user.roles
    input.action == "delete"
    input.resource in ["timeseries", "locations", "catalogs", "ratings"]
    offices.user_can_access_office(input.user, input.context.office_id)
    input.context.approval_status == "approved"
    input.context.approver_id != input.user.id
}
