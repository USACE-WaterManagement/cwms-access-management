# CWMS Authorization Proxy - Authentication Integration

## Overview

The CWMS Authorization Proxy supports multiple authentication methods that integrate with the underlying CWMS Data API. This document explains how authentication works and how to configure it.

## Current Setup

### Development Mode (Default)
In development, the proxy uses test user headers for easy testing without requiring full authentication setup:

```bash
# Test with different user personas
curl http://localhost:3001/cwms-data/offices \
  -H 'x-test-user: {"id":"dam-op-001","username":"john.doe","roles":["dam_operator"],"offices":["SPK"]}'
```

### Production Authentication Methods

The CWMS Data API supports three authentication methods that the proxy can pass through:

#### 1. API Key Authentication
```bash
# Use API key with the proxy
curl http://localhost:3001/cwms-data/offices \
  -H "Authorization: apikey <your-api-key>"
```

The proxy will:
1. Pass the API key to CWMS Data API for validation
2. Retrieve user details from the API response
3. Make authorization decision via OPA
4. Add x-cwms-auth-context header

#### 2. JWT/OpenID Connect (Keycloak)
```bash
# Use JWT token with the proxy
curl http://localhost:3001/cwms-data/offices \
  -H "Authorization: Bearer <jwt-token>"
```

The proxy will:
1. Validate JWT signature (when configured)
2. Extract user claims from token
3. Make authorization decision via OPA
4. Add x-cwms-auth-context header

#### 3. CWMS AAA (Session-based)
Legacy session-based authentication using JSESSIONIDSSO cookies.

## Authorization Flow

Regardless of authentication method, the authorization flow is:

```
Client Request → Proxy → Extract User → OPA Decision → Add Header → Forward to API
```

The proxy adds a single `x-cwms-auth-context` header containing:

```json
{
  "policy": {
    "allow": true,
    "decision_id": "proxy-123456-abc"
  },
  "user": {
    "id": "user-id",
    "username": "john.doe",
    "email": "john.doe@usace.mil",
    "roles": ["water_manager"],
    "offices": ["SPK", "SWT"],
    "primary_office": "SPK"
  },
  "constraints": {},
  "timestamp": "2025-09-29T10:00:00.000Z"
}
```

## Environment Configuration

### Development (with test users)
```env
BYPASS_AUTH=false
ENABLE_TEST_USERS=true
```

### Production (with real authentication)
```env
BYPASS_AUTH=false
ENABLE_TEST_USERS=false
JWT_VALIDATION=true
JWT_ISSUER=http://keycloak:8080/auth/realms/cwms
JWT_AUDIENCE=cwms
```

## CWMS Data API Authentication Setup

### API Key Management
The CWMS Data API provides endpoints for managing API keys:

- `GET /auth/keys` - List user's API keys
- `POST /auth/keys` - Create new API key
- `GET /auth/keys/{key-name}` - Get specific key
- `DELETE /auth/keys/{key-name}` - Delete key

### Keycloak Configuration
The CWMS Data API expects Keycloak at:
- Well-known URL: `http://localhost:8080/auth/realms/cwms/.well-known/openid-configuration`
- Realm: `cwms`
- Client ID: `cwms`

### Working JWT Token Examples

Now that Keycloak is properly configured with the CWMS realm, you can obtain JWT tokens:

```bash
# Get JWT token for m5hectest user (SWT office)
curl -s -X POST http://localhost:8080/auth/realms/cwms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=m5hectest" \
  -d "password=m5hectest" \
  -d "grant_type=password" \
  -d "client_id=cwms" | python3 -m json.tool

# Get JWT token for l1hectest user (SPL office, no permissions)
curl -s -X POST http://localhost:8080/auth/realms/cwms/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=l1hectest" \
  -d "password=l1hectest" \
  -d "grant_type=password" \
  -d "client_id=cwms" | python3 -m json.tool

# Use JWT with the proxy (pass-through mode)
curl http://localhost:3001/cwms-data/offices \
  -H "Authorization: Bearer <jwt-token>"
```

**Note**: In current pass-through mode, the proxy forwards the JWT to the CWMS Data API for validation but still uses default user context for authorization decisions. Full JWT parsing will be implemented in the next phase.

### Test Users (Keycloak & Database)
Pre-configured test users with their permissions:

| User | Password | Office | Permissions | Purpose |
|------|----------|--------|-------------|---------|
| `l2hectest.1234567890` | `l2hectest` | SPK | CWMS Users, TS ID Creator | General User with full permissions |
| `l1hectest` | `l1hectest` | SPL | None (intentionally) | Test access denial scenarios |
| `m5hectest` | `m5hectest` | SWT | CWMS Users, TS ID Creator | General User with full permissions |
| `q0hecoidc` | `q0hecoidc` | N/A | Keycloak only | Test user creation workflow |

## Integration Strategies

### Option 1: Pass-through Authentication (Current)
- Proxy forwards authentication headers unchanged
- CWMS Data API validates credentials
- Proxy adds authorization context based on authenticated user

### Option 2: Proxy-level Authentication (Future)
- Proxy validates JWT tokens directly
- Proxy manages API keys independently
- No authentication forwarded to CWMS Data API

### Option 3: Hybrid Approach
- Proxy validates JWT tokens
- Falls back to API key validation by CWMS Data API
- Supports gradual migration

## Troubleshooting

### 401 Unauthorized from API
This is expected if:
- Database users aren't configured
- Keycloak realm doesn't exist
- API keys are invalid

The proxy authorization still works - check logs to see the x-cwms-auth-context header being added.

### No User Context
If using production mode without test users:
- Ensure valid authentication header is provided
- Check JWT token hasn't expired
- Verify API key is active

### Authorization Denied
Even with valid authentication:
- Check OPA policies match user roles
- Verify user has required office permissions
- Review authorization decision in logs

## Testing Authorization

### Verify Header Addition
```bash
# Check proxy logs for authorization context
podman logs authorizer-proxy | grep x-cwms-auth-context

# Use verbose curl to see headers
curl -v http://localhost:3001/cwms-data/offices 2>&1 | grep x-cwms
```

### Test Different Personas
```bash
# Dam Operator
curl http://localhost:3001/cwms-data/timeseries \
  -H 'x-test-user: {"id":"dam-001","roles":["dam_operator"],"offices":["SPK"]}'

# Water Manager
curl http://localhost:3001/cwms-data/forecasts \
  -H 'x-test-user: {"id":"wm-001","roles":["water_manager"],"offices":["NWD"]}'

# System Admin
curl http://localhost:3001/cwms-data/admin \
  -H 'x-test-user: {"id":"admin","roles":["system_admin"],"offices":["HQ"]}'
```

## Next Steps

1. **Complete JWT Validation**: Implement direct JWT validation in proxy
2. **API Key Management**: Add proxy-level API key management
3. **User Caching**: Cache user details to reduce API calls
4. **Metrics**: Track authentication methods and success rates
5. **Production Config**: Remove test user support for production