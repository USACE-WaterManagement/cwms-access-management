-- Persona Roles and TS Groups with Embedded Embargo
-- This script creates persona-based user groups and TS groups with naming convention
-- TS Group naming: <persona>_<datatype>_<privilege>_<embargo>
-- Example: dam_operator_raw_r_72h = dam operators, raw data, read, 72 hour embargo

SET SERVEROUTPUT ON;
SET ECHO ON;

-- ============================================================================
-- PART 1: Create Persona User Groups (Roles)
-- ============================================================================
-- Available user_group_codes: 6, 8, 9, 13, 14, 15, 16, 17, 18, 19...

BEGIN
    -- dam_operator: Dam operations personnel (subject to embargo)
    BEGIN
        cwms_sec.create_user_group(
            p_user_group_id   => 'dam_operator',
            p_user_group_desc => 'Dam operations personnel - subject to embargo rules',
            p_db_office_id    => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created user group: dam_operator');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -20998 THEN
                DBMS_OUTPUT.PUT_LINE('User group dam_operator already exists');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Error creating dam_operator: ' || SQLERRM);
            END IF;
    END;

    -- water_manager: Water management personnel (embargo exempt)
    BEGIN
        cwms_sec.create_user_group(
            p_user_group_id   => 'water_manager',
            p_user_group_desc => 'Water management personnel - embargo exempt',
            p_db_office_id    => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created user group: water_manager');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -20998 THEN
                DBMS_OUTPUT.PUT_LINE('User group water_manager already exists');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Error creating water_manager: ' || SQLERRM);
            END IF;
    END;

    -- data_manager: Data management personnel (embargo exempt)
    BEGIN
        cwms_sec.create_user_group(
            p_user_group_id   => 'data_manager',
            p_user_group_desc => 'Data management personnel - embargo exempt',
            p_db_office_id    => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created user group: data_manager');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -20998 THEN
                DBMS_OUTPUT.PUT_LINE('User group data_manager already exists');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Error creating data_manager: ' || SQLERRM);
            END IF;
    END;

    -- external_cooperator: External partners (subject to embargo)
    BEGIN
        cwms_sec.create_user_group(
            p_user_group_id   => 'external_cooperator',
            p_user_group_desc => 'External partners and cooperators - subject to embargo',
            p_db_office_id    => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created user group: external_cooperator');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -20998 THEN
                DBMS_OUTPUT.PUT_LINE('User group external_cooperator already exists');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Error creating external_cooperator: ' || SQLERRM);
            END IF;
    END;

    -- public_user: Public/unauthenticated access (subject to embargo)
    BEGIN
        cwms_sec.create_user_group(
            p_user_group_id   => 'public_user',
            p_user_group_desc => 'Public access users - subject to embargo',
            p_db_office_id    => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created user group: public_user');
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLCODE = -20998 THEN
                DBMS_OUTPUT.PUT_LINE('User group public_user already exists');
            ELSE
                DBMS_OUTPUT.PUT_LINE('Error creating public_user: ' || SQLERRM);
            END IF;
    END;

    COMMIT;
END;
/

-- ============================================================================
-- PART 2: Assign Test Users to Persona Roles
-- ============================================================================

BEGIN
    -- DAMOP001 -> dam_operator (Dam Operator in SPK)
    BEGIN
        cwms_sec.add_user_to_group(
            p_username      => 'DAMOP001',
            p_user_group_id => 'dam_operator',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Added DAMOP001 to dam_operator');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error adding DAMOP001 to dam_operator: ' || SQLERRM);
    END;

    -- M5HECTEST -> water_manager (Water Manager in SWT)
    BEGIN
        cwms_sec.add_user_to_group(
            p_username      => 'M5HECTEST',
            p_user_group_id => 'water_manager',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Added M5HECTEST to water_manager');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error adding M5HECTEST to water_manager: ' || SQLERRM);
    END;

    -- DATAMGR001 -> data_manager (Data Manager in SWT)
    BEGIN
        cwms_sec.add_user_to_group(
            p_username      => 'DATAMGR001',
            p_user_group_id => 'data_manager',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Added DATAMGR001 to data_manager');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error adding DATAMGR001 to data_manager: ' || SQLERRM);
    END;

    -- L1HECTEST -> public_user (Limited User in SPL)
    BEGIN
        cwms_sec.add_user_to_group(
            p_username      => 'L1HECTEST',
            p_user_group_id => 'public_user',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Added L1HECTEST to public_user');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error adding L1HECTEST to public_user: ' || SQLERRM);
    END;

    -- EXTPARTNER -> external_cooperator (External Cooperator in SPK)
    BEGIN
        cwms_sec.add_user_to_group(
            p_username      => 'EXTPARTNER',
            p_user_group_id => 'external_cooperator',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Added EXTPARTNER to external_cooperator');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error adding EXTPARTNER to external_cooperator: ' || SQLERRM);
    END;

    -- L2HECTEST: General User (no persona group, CWMS Users only)

    COMMIT;
END;
/

-- ============================================================================
-- PART 3: Create TS Groups with Embedded Embargo Rules
-- ============================================================================
-- Naming convention: <persona>_<datatype>_<privilege>_<embargo>
-- datatype: raw, rev, all
-- privilege: r (read), w (write), rw (read-write)
-- embargo: Nh where N is hours (0h = no embargo)

BEGIN
    -- dam_operator TS groups (subject to embargo)
    BEGIN
        cwms_sec.create_ts_group(
            p_ts_group_id   => 'dam_operator_raw_r_72h',
            p_ts_group_desc => 'Dam operators - raw data read access - 72 hour embargo',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created TS group: dam_operator_raw_r_72h');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating dam_operator_raw_r_72h: ' || SQLERRM);
    END;

    BEGIN
        cwms_sec.create_ts_group(
            p_ts_group_id   => 'dam_operator_rev_r_168h',
            p_ts_group_desc => 'Dam operators - revised data read access - 168 hour embargo',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created TS group: dam_operator_rev_r_168h');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating dam_operator_rev_r_168h: ' || SQLERRM);
    END;

    -- water_manager TS groups (embargo exempt)
    BEGIN
        cwms_sec.create_ts_group(
            p_ts_group_id   => 'water_manager_all_rw_0h',
            p_ts_group_desc => 'Water managers - all data read-write - no embargo',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created TS group: water_manager_all_rw_0h');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating water_manager_all_rw_0h: ' || SQLERRM);
    END;

    -- data_manager TS groups (embargo exempt)
    BEGIN
        cwms_sec.create_ts_group(
            p_ts_group_id   => 'data_manager_all_rw_0h',
            p_ts_group_desc => 'Data managers - all data read-write - no embargo',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created TS group: data_manager_all_rw_0h');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating data_manager_all_rw_0h: ' || SQLERRM);
    END;

    -- public_user TS groups (subject to embargo)
    BEGIN
        cwms_sec.create_ts_group(
            p_ts_group_id   => 'public_user_raw_r_168h',
            p_ts_group_desc => 'Public users - raw data read access - 168 hour embargo',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created TS group: public_user_raw_r_168h');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating public_user_raw_r_168h: ' || SQLERRM);
    END;

    BEGIN
        cwms_sec.create_ts_group(
            p_ts_group_id   => 'public_user_rev_r_336h',
            p_ts_group_desc => 'Public users - revised data read access - 336 hour (14 day) embargo',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Created TS group: public_user_rev_r_336h');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error creating public_user_rev_r_336h: ' || SQLERRM);
    END;

    COMMIT;
END;
/

-- ============================================================================
-- PART 4: Assign TS Groups to Persona User Groups
-- ============================================================================
-- ASSIGN_TS_GROUP_USER_GROUP(p_ts_group_id, p_user_group_id, p_privilege, p_db_office_id)
-- p_privilege: 'READ', 'WRITE', or 'READ/WRITE'

BEGIN
    -- dam_operator assignments
    BEGIN
        cwms_sec.assign_ts_group_user_group(
            p_ts_group_id   => 'dam_operator_raw_r_72h',
            p_user_group_id => 'dam_operator',
            p_privilege     => 'READ',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Assigned dam_operator_raw_r_72h to dam_operator with READ');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error assigning dam_operator_raw_r_72h: ' || SQLERRM);
    END;

    BEGIN
        cwms_sec.assign_ts_group_user_group(
            p_ts_group_id   => 'dam_operator_rev_r_168h',
            p_user_group_id => 'dam_operator',
            p_privilege     => 'READ',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Assigned dam_operator_rev_r_168h to dam_operator with READ');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error assigning dam_operator_rev_r_168h: ' || SQLERRM);
    END;

    -- water_manager assignments
    BEGIN
        cwms_sec.assign_ts_group_user_group(
            p_ts_group_id   => 'water_manager_all_rw_0h',
            p_user_group_id => 'water_manager',
            p_privilege     => 'Read-Write',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Assigned water_manager_all_rw_0h to water_manager with READ/WRITE');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error assigning water_manager_all_rw_0h: ' || SQLERRM);
    END;

    -- data_manager assignments
    BEGIN
        cwms_sec.assign_ts_group_user_group(
            p_ts_group_id   => 'data_manager_all_rw_0h',
            p_user_group_id => 'data_manager',
            p_privilege     => 'Read-Write',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Assigned data_manager_all_rw_0h to data_manager with READ/WRITE');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error assigning data_manager_all_rw_0h: ' || SQLERRM);
    END;

    -- public_user assignments
    BEGIN
        cwms_sec.assign_ts_group_user_group(
            p_ts_group_id   => 'public_user_raw_r_168h',
            p_user_group_id => 'public_user',
            p_privilege     => 'READ',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Assigned public_user_raw_r_168h to public_user with READ');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error assigning public_user_raw_r_168h: ' || SQLERRM);
    END;

    BEGIN
        cwms_sec.assign_ts_group_user_group(
            p_ts_group_id   => 'public_user_rev_r_336h',
            p_user_group_id => 'public_user',
            p_privilege     => 'READ',
            p_db_office_id  => 'HQ'
        );
        DBMS_OUTPUT.PUT_LINE('Assigned public_user_rev_r_336h to public_user with READ');
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error assigning public_user_rev_r_336h: ' || SQLERRM);
    END;

    COMMIT;
END;
/

-- ============================================================================
-- PART 5: Cleanup - Remove old embargo table (if exists)
-- ============================================================================

BEGIN
    EXECUTE IMMEDIATE 'DROP TABLE cwms_20.at_sec_ts_group_embargo';
    DBMS_OUTPUT.PUT_LINE('Dropped old table: at_sec_ts_group_embargo');
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -942 THEN
            DBMS_OUTPUT.PUT_LINE('Table at_sec_ts_group_embargo does not exist (OK)');
        ELSE
            DBMS_OUTPUT.PUT_LINE('Error dropping table: ' || SQLERRM);
        END IF;
END;
/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

PROMPT
PROMPT === Persona User Groups ===
SELECT user_group_id, user_group_desc
FROM cwms_20.at_sec_user_groups
WHERE db_office_code = (SELECT office_code FROM cwms_20.cwms_office WHERE office_id = 'HQ')
AND user_group_id IN ('dam_operator', 'water_manager', 'data_manager', 'external_cooperator', 'public_user')
ORDER BY user_group_id;

PROMPT
PROMPT === User-Persona Assignments ===
SELECT username, user_group_id
FROM cwms_20.av_sec_users
WHERE user_group_id IN ('dam_operator', 'water_manager', 'data_manager', 'external_cooperator', 'public_user')
AND is_member = 'T'
ORDER BY username, user_group_id;

PROMPT
PROMPT === TS Groups with Embedded Embargo ===
SELECT ts_group_code, ts_group_id
FROM cwms_20.at_sec_ts_groups
WHERE ts_group_id LIKE '%_r_%h' OR ts_group_id LIKE '%_rw_%h'
ORDER BY ts_group_id;

PROMPT
PROMPT === TS Group to User Group Assignments ===
SELECT tsg.ts_group_id, ug.user_group_id, sa.privilege_bit
FROM cwms_20.at_sec_allow sa
JOIN cwms_20.at_sec_ts_groups tsg ON sa.ts_group_code = tsg.ts_group_code
JOIN cwms_20.at_sec_user_groups ug ON sa.user_group_code = ug.user_group_code AND sa.db_office_code = ug.db_office_code
WHERE tsg.ts_group_id LIKE '%_r_%h' OR tsg.ts_group_id LIKE '%_rw_%h'
ORDER BY tsg.ts_group_id;

PROMPT
PROMPT SQL Script completed successfully!
