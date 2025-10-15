#!/usr/bin/env node
import { Command } from 'commander';

import { loginCommand, logoutCommand } from './commands/login';
import { usersCommand } from './commands/users';
import { rolesCommand } from './commands/roles';
import { policiesCommand } from './commands/policies';
import { logger } from './utils/logger';
import { getVersion } from './utils/version';

const program = new Command();

program
  .name('cwms-admin')
  .description('CWMS Access Management CLI')
  .version(getVersion());

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(usersCommand);
program.addCommand(rolesCommand);
program.addCommand(policiesCommand);

program.parseAsync(process.argv).catch((error) => {
  logger.error({ error }, 'Command failed');
  process.exit(1);
});
