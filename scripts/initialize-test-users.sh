#!/bin/bash

set -e

if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8080/auth}"
REALM="${REALM:-cwms}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASS="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
DB_CONTAINER="${DB_CONTAINER:-cwmsdb}"
ISSUER="${ISSUER:-http://localhost:8080/auth/realms/cwms}"

echo "CWMS Test User Initialization"
echo "This will create/update all 8 test personas in Keycloak and database."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "Logging into Keycloak..."
podman exec auth /opt/keycloak/bin/kcadm.sh config credentials \
  --server $KEYCLOAK_URL \
  --realm master \
  --user $ADMIN_USER \
  --password $ADMIN_PASS

create_or_get_user() {
    local username=$1
    local email=$2
    local first_name=$3
    local last_name=$4

    USER_ID=$(podman exec auth /opt/keycloak/bin/kcadm.sh get users \
      -r $REALM \
      -q username=$username \
      --fields id \
      --format csv \
      --noquotes 2>/dev/null | tail -1)

    if [ -z "$USER_ID" ] || [ "$USER_ID" == "id" ]; then
        RESULT=$(podman exec auth /opt/keycloak/bin/kcadm.sh create users \
          -r $REALM \
          -s username=$username \
          -s enabled=true \
          -s email=$email \
          -s firstName="$first_name" \
          -s lastName="$last_name" \
          -i 2>&1 || echo "")

        if [[ $RESULT == *"Created new user"* ]]; then
            USER_ID=$(echo $RESULT | grep -oE '[a-f0-9-]{36}')
        else
            USER_ID=$(podman exec auth /opt/keycloak/bin/kcadm.sh get users \
              -r $REALM \
              -q username=$username \
              --fields id \
              --format csv \
              --noquotes 2>/dev/null | tail -1)
        fi

        podman exec auth /opt/keycloak/bin/kcadm.sh set-password \
          -r $REALM \
          --username $username \
          --new-password $username 2>/dev/null || true
    fi

    echo "$USER_ID"
}

echo "Creating/retrieving Keycloak users..."
DAMOP_USER_ID=$(create_or_get_user "damop001" "damop001@usace.mil" "Dam" "Operator")
M5_USER_ID=$(create_or_get_user "m5hectest" "m5hectest@usace.mil" "M5" "Test")
DATAMGR_USER_ID=$(create_or_get_user "datamgr001" "datamgr001@usace.mil" "Data" "Manager")
L1_USER_ID=$(create_or_get_user "l1hectest" "l1hectest@usace.mil" "L1" "Test")
L2_USER_ID=$(create_or_get_user "l2hectest" "l2hectest@usace.mil" "L2" "Test")
APICOLL_USER_ID=$(create_or_get_user "apicollector" "apicollector@usace.mil" "API" "Collector")
APIPROC_USER_ID=$(create_or_get_user "apiprocessor" "apiprocessor@usace.mil" "API" "Processor")
EXTPART_USER_ID=$(create_or_get_user "extpartner" "extpartner@usace.mil" "External" "Partner")

echo "Configuring database users..."
podman exec $DB_CONTAINER bash -c "cat <<'EOF' | sqlplus -s CWMS_20/simplecwmspasswD1@FREEPDB1
SET SERVEROUTPUT ON;
WHENEVER SQLERROR CONTINUE;

BEGIN
  FOR usr IN (SELECT DISTINCT userid FROM at_sec_cwms_users
              WHERE userid IN ('DAMOP001', 'M5HECTEST', 'DATAMGR001', 'L1HECTEST', 'L2HECTEST',
                              'APICOLLECTOR', 'APIPROCESSOR', 'EXTPARTNER'))
  LOOP
    FOR grp IN (SELECT DISTINCT user_group_id FROM av_sec_users WHERE UPPER(username) = usr.userid)
    LOOP
      BEGIN
        cwms_sec.remove_user_from_group(usr.userid, grp.user_group_id, 'HQ');
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END LOOP;
  END LOOP;
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('DAMOP001', NULL, 'SPK'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('DAMOP001', 'All Users', 'SPK');
  cwms_sec.add_user_to_group('DAMOP001', 'CWMS Users', 'SPK');
  cwms_sec.add_user_to_group('DAMOP001', 'TS ID Creator', 'SPK');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${DAMOP_USER_ID}' WHERE userid = 'DAMOP001';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('M5HECTEST', NULL, 'SWT'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('M5HECTEST', 'All Users', 'SWT');
  cwms_sec.add_user_to_group('M5HECTEST', 'CWMS Users', 'SWT');
  cwms_sec.add_user_to_group('M5HECTEST', 'TS ID Creator', 'SWT');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${M5_USER_ID}' WHERE userid = 'M5HECTEST';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('DATAMGR001', NULL, 'SWT'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('DATAMGR001', 'All Users', 'SWT');
  cwms_sec.add_user_to_group('DATAMGR001', 'CWMS Users', 'SWT');
  cwms_sec.add_user_to_group('DATAMGR001', 'TS ID Creator', 'SWT');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${DATAMGR_USER_ID}' WHERE userid = 'DATAMGR001';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('L1HECTEST', NULL, 'SPL'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('L1HECTEST', 'All Users', 'SPL');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${L1_USER_ID}' WHERE userid = 'L1HECTEST';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('L2HECTEST', NULL, 'SPK'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('L2HECTEST', 'All Users', 'SPK');
  cwms_sec.add_user_to_group('L2HECTEST', 'CWMS Users', 'SPK');
  cwms_sec.add_user_to_group('L2HECTEST', 'TS ID Creator', 'SPK');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${L2_USER_ID}' WHERE userid = 'L2HECTEST';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('APICOLLECTOR', NULL, 'SPK'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('APICOLLECTOR', 'All Users', 'SPK');
  cwms_sec.add_user_to_group('APICOLLECTOR', 'CWMS Users', 'SPK');
  cwms_sec.add_user_to_group('APICOLLECTOR', 'TS ID Creator', 'SPK');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${APICOLL_USER_ID}' WHERE userid = 'APICOLLECTOR';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('APIPROCESSOR', NULL, 'HQ'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('APIPROCESSOR', 'All Users', 'HQ');
  cwms_sec.add_user_to_group('APIPROCESSOR', 'CWMS Users', 'HQ');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${APIPROC_USER_ID}' WHERE userid = 'APIPROCESSOR';
END;
/

BEGIN
  BEGIN cwms_sec.add_cwms_user('EXTPARTNER', NULL, 'SPK'); EXCEPTION WHEN OTHERS THEN NULL; END;
  cwms_sec.add_user_to_group('EXTPARTNER', 'All Users', 'SPK');
  cwms_sec.add_user_to_group('EXTPARTNER', 'CWMS Users', 'SPK');
  UPDATE at_sec_cwms_users SET principle_name = '${ISSUER}::${EXTPART_USER_ID}' WHERE userid = 'EXTPARTNER';
END;
/

COMMIT;

SELECT userid, office, SUBSTR(principle_name, 1, 80) as principal
FROM at_sec_cwms_users
WHERE userid IN ('DAMOP001', 'M5HECTEST', 'DATAMGR001', 'L1HECTEST', 'L2HECTEST',
                 'APICOLLECTOR', 'APIPROCESSOR', 'EXTPARTNER')
ORDER BY userid;

SELECT DISTINCT username, user_group_id
FROM av_sec_users
WHERE UPPER(username) IN ('DAMOP001', 'M5HECTEST', 'DATAMGR001', 'L1HECTEST', 'L2HECTEST',
                          'APICOLLECTOR', 'APIPROCESSOR', 'EXTPARTNER')
ORDER BY username, user_group_id;

EXIT;
EOF"

echo ""
echo "Creating API keys..."
podman exec $DB_CONTAINER bash -c "cat <<'EOF' | sqlplus -s CWMS_20/simplecwmspasswD1@FREEPDB1
WHENEVER SQLERROR CONTINUE;

BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE at_api_keys(
    userid varchar2(128) not null references at_sec_cwms_users(USERID),
    key_name varchar2(64) not null,
    apikey varchar2(256) not null unique,
    created date default current_timestamp not null,
    expires date default current_timestamp+1,
    primary key(userid,key_name)
  )';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -955 THEN RAISE; END IF;
END;
/

DELETE FROM at_api_keys WHERE userid IN ('CWMS_20', 'M5HECTEST', 'L2HECTEST');

INSERT INTO at_api_keys VALUES('CWMS_20', 'authorization-proxy', 'AuthProxyKey2025SecureRandomString', SYSDATE, SYSDATE + 365);
INSERT INTO at_api_keys VALUES('M5HECTEST', 'test-key', 'testkey2', SYSDATE, SYSDATE + 365);
INSERT INTO at_api_keys VALUES('L2HECTEST', 'test-key', 'l2userkey', SYSDATE, SYSDATE + 365);

COMMIT;

SELECT userid, key_name, apikey, TO_CHAR(expires, 'YYYY-MM-DD') as expires FROM at_api_keys ORDER BY userid;

EXIT;
EOF"

echo ""
echo "Test user initialization complete!"
echo "All 8 personas configured with proper Keycloak mappings."
