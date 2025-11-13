package cwms.helpers.offices

import future.keywords.contains
import future.keywords.if
import future.keywords.in

# Example configuration: Office metadata and relationships
# In production, we should load this data dynamically from a source like:
# - OPA Data API: curl -X PUT http://localhost:8181/v1/data/cwms/offices -d @offices.json
# - Database Query: Query CDA API to get current office list
# - Configuration File: Load from config/offices.json at startup
# We will solution this in a future sprint.
offices := {
    "HQ": {
        "type": "headquarters",
        "parent": null,
        "region": "headquarters"
    },
    "SPK": {
        "type": "district",
        "parent": "SPD",
        "region": "south_pacific",
        "timezone": "America/Los_Angeles"
    },
    "SPN": {
        "type": "district",
        "parent": "SPD",
        "region": "south_pacific",
        "timezone": "America/Los_Angeles"
    },
    "SPL": {
        "type": "district",
        "parent": "SPD",
        "region": "south_pacific",
        "timezone": "America/Los_Angeles"
    },
    "SWT": {
        "type": "district",
        "parent": "SWD",
        "region": "southwestern",
        "timezone": "America/Chicago"
    },
    "SPA": {
        "type": "district",
        "parent": "SWD",
        "region": "southwestern",
        "timezone": "America/Denver"
    },
    "GAL": {
        "type": "district",
        "parent": "SWD",
        "region": "southwestern",
        "timezone": "America/Chicago"
    },
    "FTW": {
        "type": "district",
        "parent": "SWD",
        "region": "southwestern",
        "timezone": "America/Chicago"
    },
    "MVR": {
        "type": "district",
        "parent": "MVD",
        "region": "mississippi",
        "timezone": "America/Chicago"
    },
    "MVS": {
        "type": "district",
        "parent": "MVD",
        "region": "mississippi",
        "timezone": "America/Chicago"
    },
    "MVP": {
        "type": "district",
        "parent": "MVD",
        "region": "mississippi",
        "timezone": "America/Chicago"
    },
    "MVM": {
        "type": "district",
        "parent": "MVD",
        "region": "mississippi",
        "timezone": "America/Chicago"
    },
    "MVN": {
        "type": "district",
        "parent": "MVD",
        "region": "mississippi",
        "timezone": "America/Chicago"
    }
}

regions := {
    "southwestern": {
        "division": "SWD",
        "districts": ["SWT", "SPA", "GAL", "FTW"]
    },
    "south_pacific": {
        "division": "SPD",
        "districts": ["SPK", "SPN", "SPL"]
    },
    "mississippi": {
        "division": "MVD",
        "districts": ["MVR", "MVS", "MVP", "MVM", "MVN"]
    }
}

user_can_access_office(user, office_id) if {
    office_id in user.offices
}

user_can_access_office(user, office_id) if {
    user.persona == "data_manager"
    user.region != null
    office_id in regions[user.region].districts
}

user_can_access_office(user, office_id) if {
    user.persona == "automated_processor"
}

user_can_access_office(user, office_id) if {
    "system_admin" in user.roles
}

user_can_access_office(user, office_id) if {
    "hec_employee" in user.roles
}
