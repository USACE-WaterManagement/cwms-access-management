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
      username: 'damop001',
      password: 'damop001',
      expectedOffice: 'SPK',
      expectedRoles: ['dam_operator', 'CWMS Users', 'All Users', 'TS ID Creator'],
    },
    waterManager: {
      username: 'm5hectest',
      password: 'm5hectest',
      expectedOffice: 'SWT',
      expectedRoles: ['water_manager', 'CWMS Users', 'All Users', 'TS ID Creator'],
    },
    dataManager: {
      username: 'datamgr001',
      password: 'datamgr001',
      expectedOffice: 'SWT',
      expectedRoles: ['data_manager', 'CWMS Users', 'All Users', 'TS ID Creator'],
    },
    limitedUser: {
      username: 'l1hectest',
      password: 'l1hectest',
      expectedOffice: 'SPL',
      expectedRoles: ['public_user', 'All Users'],
    },
    generalUser: {
      username: 'l2hectest',
      password: 'l2hectest',
      expectedOffice: 'SPK',
      expectedRoles: ['CWMS Users', 'All Users', 'TS ID Creator'],
    },
  },
  timeouts: {
    request: 10000,
    test: 30000,
  },
};

export type TestUser = keyof typeof config.testUsers;
