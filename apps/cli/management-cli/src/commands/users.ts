import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { table } from 'table';

import { logger } from '../utils/logger';
import { ApiService } from '../services/api.service';

const apiService = new ApiService();

export const usersCommand = new Command('users')
  .description('Manage users')
  .addCommand(
    new Command('list').description('List all users').action(async () => {
      const spinner = ora('Loading users...').start();
      try {
        const users = await apiService.getUsers();
        spinner.stop();

        if (users.length === 0) {
          console.log(chalk.yellow('No users found'));

          return;
        }

        console.log(chalk.bold(`\nFound ${users.length} users:\n`));

        const tableData = [
          [
            chalk.bold('Username'),
            chalk.bold('ID'),
            chalk.bold('Email'),
            chalk.bold('Name'),
            chalk.bold('Status'),
          ],
          ...users.map((user) => [
            chalk.cyan(user.username),
            chalk.gray(user.id.substring(0, 8) + '...'),
            user.email || '-',
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-',
            user.enabled ? chalk.green('Enabled') : chalk.red('Disabled'),
          ]),
        ];

        console.log(table(tableData, {
          border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼',
          },
        }));
      } catch (error) {
        spinner.stop();
        console.error(chalk.red('Failed to load users'));
        logger.error({ error }, 'Failed to load users');
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    }),
  )
  .addCommand(
    new Command('show')
      .description('Show user details')
      .argument('<id>', 'User ID to show')
      .action(async (id: string) => {
        const spinner = ora(`Loading user ${id}...`).start();
        try {
          const user = await apiService.getUser(id);
          spinner.stop();

          console.log(chalk.bold('\nUser Details:'));
          console.log(chalk.cyan(`  Username:    ${user.username}`));
          console.log(chalk.gray(`  ID:          ${user.id}`));
          if (user.email) {
            console.log(chalk.gray(`  Email:       ${user.email}`));
          }
          if (user.firstName) {
            console.log(chalk.gray(`  First Name:  ${user.firstName}`));
          }
          if (user.lastName) {
            console.log(chalk.gray(`  Last Name:   ${user.lastName}`));
          }
          console.log(
            chalk.gray(`  Status:      ${user.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}`),
          );
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`Failed to load user ${id}`));
          logger.error({ error, id }, 'Failed to load user');
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          process.exit(1);
        }
      }),
  );
