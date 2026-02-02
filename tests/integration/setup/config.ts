export const config = {
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    realm: 'cwms',
    clientId: 'cwms',
  },
  proxy: {
    url: process.env.PROXY_URL || 'http://localhost:3001',
  },
  api: {
    url: process.env.API_URL || 'http://localhost:7001',
  },
  managementApi: {
    url: process.env.MANAGEMENT_API_URL || 'http://localhost:3002',
  },
  opa: {
    url: process.env.OPA_URL || 'http://localhost:8181',
  },
  testUsers: {
    damOperator: {
      username: 'm5hectest',
      password: 'm5hectest',
      expectedOffice: 'SWT',
      expectedRoles: ['dam_operator', 'CWMS Users', 'All Users'],
    },
    waterManager: {
      username: 'l2hectest.1234567890',
      password: 'l2hectest',
      expectedOffice: 'SPK',
      expectedRoles: ['water_manager', 'CWMS Users', 'All Users', 'TS ID Creator'],
    },
    viewerUser: {
      username: 'l1hectest',
      password: 'l1hectest',
      expectedOffice: 'SPL',
      expectedRoles: ['Viewer Users'],
    },
  },
  timeouts: {
    request: 10000,
    test: 30000,
  },
};

export type TestUser = keyof typeof config.testUsers;
