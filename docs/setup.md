# First-Time Setup

This guide walks you through the one-time setup required before running the authorization proxy for the first time.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 24+**
- **pnpm 10.15.1+**
- **Podman or Docker**
- **CWMS Infrastructure Setup Complete** - You must first complete the setup from the
  [cwms-data-api repository](https://github.com/HydrologicEngineeringCenter/cwms-data-api). This includes:
  - Oracle Database container (cwmsdb) running on port 1521
  - CWMS Data API container (data-api) running on port 7001
  - Keycloak container (auth) running on port 8080
  - Traefik container (traefik) running on port 8081

**IMPORTANT**: If you haven't set up the cwms-data-api project yet, do that first before proceeding with this
authorization proxy setup. Follow the instructions in the cwms-data-api repository's README to get the database and API
containers running.

### Tool Installation

**Recommended**: Use [mise](https://mise.jdx.dev/) to manage Node.js and pnpm versions:

```bash
# Install mise (if not already installed)
curl https://mise.run | sh

# Install Node.js and pnpm as specified in workspace
mise install

# Verify installation
node --version  # Should show v24.x.x
pnpm --version  # Should show 10.15.1
```

The versions are configured in the workspace's `mise.toml` file.

## Setup Steps

### 1. Configure Environment

Create your local environment configuration:

```bash
# Copy environment template
cp .env.example .env

# Load OPA whitelist from configuration file
./scripts/load-whitelist.sh

# Verify configuration
cat .env | grep OPA_WHITELIST
```

#### Environment Variables

Key configuration options in `.env`:

- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Proxy server port (default: 3001)
- `LOG_LEVEL` - Logging verbosity (debug/info/warn/error)
- `CWMS_API_URL` - Downstream API URL
- `OPA_URL` - OPA service URL
- `REDIS_URL` - Redis connection string
- `BYPASS_AUTH` - Skip authorization (dev only, set to `true`)
- `OPA_WHITELIST_ENDPOINTS` - JSON array of endpoints requiring OPA authorization

See [configuration.md](../apps/services/authorizer-proxy/docs/configuration.md) for complete documentation.

### 2. Verify Dependent Services

Ensure all required CWMS infrastructure is running:

```bash
# Check all services
podman ps | grep -E "cwmsdb|data-api|auth|traefik"

# Expected output should show 4 running containers:
# - cwmsdb (database)
# - data-api (CWMS API)
# - auth (Keycloak)
# - traefik (reverse proxy)
```

If services are not running, start them from the cwms-data-api project:

```bash
cd ../cwms-data-api
podman start cwmsdb data-api auth traefik

# Verify they're running
podman ps
```

### 3. Configure Keycloak

The CWMS realm configuration is provided in the cwms-data-api repository. Import this realm to get pre-configured users
and client settings.

#### Import Realm Configuration

```bash
# Ensure Keycloak container is running
podman ps | grep auth

# Import realm from cwms-data-api repository
# Note: Adjust the path if your repositories are in different locations
REALM_FILE="../cwms-data-api/compose_files/keycloak/realm.json"

podman exec -it auth /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080/auth \
  --realm master \
  --user admin \
  --password admin

# Import the realm (creates or updates)
podman cp $REALM_FILE auth:/tmp/realm.json
podman exec auth /opt/keycloak/bin/kcadm.sh create realms \
  -f /tmp/realm.json \
  -s enabled=true

# Verify realm was imported
podman exec auth /opt/keycloak/bin/kcadm.sh get realms/cwms | jq '.enabled'
# Should output: true
```

The realm.json file includes:

- Pre-configured test users (l1hectest, l2hectest, m5hectest, q0hecoidc)
- CWMS client with directAccessGrantsEnabled: true
- Required roles (cwms_user, offline_access, uma_authorization)

#### Alternative: Manual Configuration via Admin Console

If you don't have access to the realm.json file:

1. Open <http://localhost:8080/auth/admin/>
2. Login with `admin` / `admin`
3. Create **cwms** realm
4. Go to **Clients** > Create > **cwms**
5. Set **Access Type** to `public`
6. Enable **Direct Access Grants**
7. Click **Save**
8. Create test users manually

### 4. Verify Test Users

Check that test users exist in Keycloak:

```bash
# List users in cwms realm
podman exec auth /opt/keycloak/bin/kcadm.sh get users -r cwms \
  | jq -r '.[].username'
```

Expected users:

| Username    | Password    | Office | Permissions               | Purpose                            |
| ----------- | ----------- | ------ | ------------------------- | ---------------------------------- |
| `l1hectest` | `l1hectest` | SPL    | None                      | Test access denial scenarios       |
| `l2hectest` | `l2hectest` | SPK    | CWMS Users, TS ID Creator | General user with full permissions |
| `m5hectest` | `m5hectest` | SWT    | CWMS Users, TS ID Creator | General user with full permissions |
| `q0hecoidc` | `q0hecoidc` | N/A    | Keycloak only             | Test user creation workflow        |

#### Test Authentication

Verify you can get JWT tokens from Keycloak:

```bash
# Get JWT token for test user
TOKEN=$(curl -s -X POST http://localhost:8080/auth/realms/cwms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=m5hectest" \
  -d "password=m5hectest" \
  -d "grant_type=password" \
  -d "client_id=cwms" \
  | jq -r '.access_token')

# Verify token was retrieved
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo "Authentication successful!"
  echo "Token: ${TOKEN:0:50}..."
else
  echo "Authentication failed!"
fi
```

### 5. Install Dependencies

Install all Node.js dependencies:

```bash
# Install dependencies using pnpm
pnpm install

# Verify installation
pnpm nx --version
```

This installs all workspace dependencies including the authorizer-proxy service.

## Verification

After completing setup, verify everything is ready:

```bash
# Check environment configuration
test -f .env && echo "Environment configured" || echo "Missing .env file"

# Check dependent services
SERVICES=$(podman ps --format "{{.Names}}" | grep -c -E "cwmsdb|data-api|auth|traefik")
if [ "$SERVICES" -eq 4 ]; then
  echo "All dependent services running"
else
  echo "Missing dependent services ($SERVICES/4 running)"
fi

# Check Keycloak realm
REALM_STATUS=$(podman exec auth /opt/keycloak/bin/kcadm.sh get realms/cwms 2>/dev/null | jq -r '.enabled')
if [ "$REALM_STATUS" == "true" ]; then
  echo "Keycloak realm enabled"
else
  echo "Keycloak realm not enabled"
fi

# Check dependencies installed
test -d node_modules && echo "Dependencies installed" || echo "Run pnpm install"
```

## Next Steps

After setup is complete, you can:

1. **Start the authorization services**: See [development.md](development.md) for local development
2. **Run in containers**: See [container-operations.md](container-operations.md) for Docker/Podman
3. **Test the proxy**: Try the examples in the [README](../README.md)
4. **Review OPA configuration**: See
   [OPA whitelist guide](../apps/services/authorizer-proxy/docs/opa-whitelist-guide.md)

## Troubleshooting

If you encounter issues during setup, see [troubleshooting.md](troubleshooting.md) for common problems and solutions.
