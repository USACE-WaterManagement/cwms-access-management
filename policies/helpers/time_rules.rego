package cwms.helpers.time_rules

import future.keywords.contains
import future.keywords.if
import future.keywords.in

embargo_exempt_personas := ["data_manager", "water_manager", "system_admin", "hec_employee"]

# Legacy office-based embargo periods in nanoseconds (kept for backward compatibility)
embargo_periods := {
    "SPK": 7 * 24 * 60 * 60 * 1000000000,
    "SWT": 3 * 24 * 60 * 60 * 1000000000,
    "DEFAULT": 7 * 24 * 60 * 60 * 1000000000
}

# Legacy: Office-based embargo check (kept for backward compatibility)
data_under_embargo(resource, user) if {
    not user.persona in embargo_exempt_personas
    resource.timestamp_ns != null
    embargo_period := object.get(embargo_periods, resource.office, embargo_periods.DEFAULT)
    time.now_ns() - resource.timestamp_ns < embargo_period
}

# Check if user is exempt from embargo based on persona
user_embargo_exempt(user) if {
    user.persona in embargo_exempt_personas
}

# Get embargo hours for a specific ts_group from user's ts_privileges
get_ts_group_embargo_hours(user, ts_group_id) := hours if {
    priv := user.ts_privileges[_]
    priv.ts_group_id == ts_group_id
    hours := priv.embargo_hours
}

# Default embargo hours if ts_group not found in user privileges
get_ts_group_embargo_hours(user, ts_group_id) := 168 if {
    not ts_group_in_privileges(user, ts_group_id)
}

ts_group_in_privileges(user, ts_group_id) if {
    priv := user.ts_privileges[_]
    priv.ts_group_id == ts_group_id
}

# TS Group-based embargo check
data_under_ts_group_embargo(resource, user) if {
    not user_embargo_exempt(user)
    resource.timestamp_ns != null
    resource.ts_group_id != null
    embargo_hours := get_ts_group_embargo_hours(user, resource.ts_group_id)
    embargo_hours > 0
    embargo_ns := embargo_hours * 60 * 60 * 1000000000
    time.now_ns() - resource.timestamp_ns < embargo_ns
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
