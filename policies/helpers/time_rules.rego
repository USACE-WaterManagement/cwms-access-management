package cwms.helpers.time_rules

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# Example configuration: Embargo periods in nanoseconds
# In production, we should load this data dynamically from a source like:
# - Configuration File: config/embargo-rules.json
# - Database Table: Query CWMS database for office-specific embargo rules
# - OPA Data API: curl -X PUT http://localhost:8181/v1/data/cwms/embargo_rules -d @rules.json
# We will solution this in a future sprint.
embargo_periods := {
    "SPK": 7 * 24 * 60 * 60 * 1000000000,
    "SWT": 3 * 24 * 60 * 60 * 1000000000,
    "DEFAULT": 7 * 24 * 60 * 60 * 1000000000
}

data_under_embargo(resource, user) if {
    not user.persona in ["data_manager", "water_manager", "system_admin"]
    resource.timestamp_ns != null
    embargo_period := object.get(embargo_periods, resource.office, embargo_periods.DEFAULT)
    time.now_ns() - resource.timestamp_ns < embargo_period
}

within_shift_hours(user) if {
    user.persona == "dam_operator"
    user.shift_start != null
    user.shift_end != null
    user.timezone != null

    current_hour := time.clock([time.now_ns(), user.timezone])[0]
    current_hour >= user.shift_start
    current_hour < user.shift_end
}

within_shift_hours(user) if {
    user.persona != "dam_operator"
}

within_modification_window(resource, user) if {
    user.persona == "dam_operator"
    resource.created_ns != null
    time.now_ns() - resource.created_ns < 24 * 60 * 60 * 1000000000
}
