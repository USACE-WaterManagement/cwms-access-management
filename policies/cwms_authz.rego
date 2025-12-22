package cwms.authz

import data.cwms.helpers.offices
import data.cwms.helpers.time_rules
import data.cwms.personas.public
import data.cwms.personas.dam_operator
import data.cwms.personas.water_manager
import data.cwms.personas.data_manager
import data.cwms.personas.automated_collector
import data.cwms.personas.automated_processor
import data.cwms.personas.external_cooperator
import future.keywords.contains
import future.keywords.if
import future.keywords.in

default allow := false

allow if {
    public.allow
}

allow if {
    dam_operator.allow
}

allow if {
    water_manager.allow
}

allow if {
    data_manager.allow
}

allow if {
    automated_collector.allow
}

allow if {
    automated_processor.allow
}

allow if {
    external_cooperator.allow
}

allow if {
    "system_admin" in input.user.roles
}

allow if {
    "hec_employee" in input.user.roles
}
