package cwms.authz

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# Default deny
default allow := false

# Allow health check endpoints
allow if {
    input.resource in ["health", "ready", "metrics"]
}

# Public read-only endpoints
allow if {
    input.action == "read"
    input.resource in ["offices", "units", "parameters"]
}


# Dam Operator Permissions
allow if {
    "dam_operator" in input.user.roles
    input.resource in ["timeseries", "measurements", "levels", "gates"]
    input.action in ["read", "create", "update"]
}

# Water Manager Permissions
allow if {
    "water_manager" in input.user.roles
    input.resource in ["forecasts", "models", "scenarios"]
    input.action in ["read", "create", "update", "delete"]
}

# Data Manager Permissions
allow if {
    "data_manager" in input.user.roles
    input.resource in ["timeseries", "locations", "catalogs", "ratings"]
    input.action in ["read", "create", "update", "delete"]
}

# HEC Employee Permissions (full access)
allow if {
    "hec_employee" in input.user.roles
}

# System Admin Permissions (full access)
allow if {
    "system_admin" in input.user.roles
}

# Office-based access control
allow if {
    input.action == "read"
    input.user.offices[_] == input.context.office_id
}

# Time-based embargo rules
allow if {
    not embargoed
}

# Check if data is embargoed
embargoed if {
    input.resource == "timeseries"
    input.context.data_age_hours < 24
    not "data_manager" in input.user.roles
    not "system_admin" in input.user.roles
}

# Helper rules for debugging
user_has_role[role] if {
    role := input.user.roles[_]
}

user_in_office[office] if {
    office := input.user.offices[_]
}