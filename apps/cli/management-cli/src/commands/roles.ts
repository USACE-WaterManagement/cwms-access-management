import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

import { logger } from '../utils/logger';
import { ApiService } from '../services/api.service';

const apiService = new ApiService();

export const rolesCommand = new Command('roles')
  .description('Manage roles')
  .addCommand(
    new Command('list').description('List all roles').action(async () => {
      const spinner = ora('Loading roles...').start();
      try {
        const roles = await apiService.getRoles();
        spinner.stop();

        if (roles.length === 0) {
          console.log(chalk.yellow('No roles found'));

          return;
        }

        console.log(chalk.bold(`\nFound ${roles.length} roles:\n`));
        roles.forEach((role) => {
          console.log(
            chalk.cyan(`  ${role.name}`),
            chalk.gray(`(${role.id})`),
          );
          if (role.description) {
            console.log(chalk.gray(`    ${role.description}`));
          }
          console.log();
        });
      } catch (error) {
        spinner.stop();
        console.error(chalk.red('Failed to load roles'));
        logger.error({ error }, 'Failed to load roles');
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    }),
  )
  .addCommand(
    new Command('show')
      .description('Show role details')
      .argument('<id>', 'Role ID to show')
      .action(async (id: string) => {
        const spinner = ora(`Loading role ${id}...`).start();
        try {
          const role = await apiService.getRole(id);
          spinner.stop();

          console.log(chalk.bold('\nRole Details:'));
          console.log(chalk.cyan(`  Name:        ${role.name}`));
          console.log(chalk.gray(`  ID:          ${role.id}`));
          if (role.description) {
            console.log(chalk.gray(`  Description: ${role.description}`));
          }
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`Failed to load role ${id}`));
          logger.error({ error, id }, 'Failed to load role');
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          process.exit(1);
        }
      }),
  );
