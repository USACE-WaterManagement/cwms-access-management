import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

import { logger } from '../utils/logger';
import { ApiService } from '../services/api.service';

const apiService = new ApiService();

export const policiesCommand = new Command('policies')
  .description('Manage authorization policies')
  .addCommand(
    new Command('list').description('List all policies').action(async () => {
      const spinner = ora('Loading policies...').start();
      try {
        const policies = await apiService.getPolicies();
        spinner.stop();

        if (policies.length === 0) {
          console.log(chalk.yellow('No policies found'));

          return;
        }

        console.log(chalk.bold(`\nFound ${policies.length} policies:\n`));
        policies.forEach((policy) => {
          console.log(
            chalk.cyan(`  ${policy.name}`),
            chalk.gray(`(${policy.id})`),
          );
          console.log(chalk.gray(`    ${policy.description}`));
          console.log();
        });
      } catch (error) {
        spinner.stop();
        console.error(chalk.red('Failed to load policies'));
        logger.error({ error }, 'Failed to load policies');
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        process.exit(1);
      }
    }),
  )
  .addCommand(
    new Command('show')
      .description('Show policy details')
      .argument('<id>', 'Policy ID to show')
      .action(async (id: string) => {
        const spinner = ora(`Loading policy ${id}...`).start();
        try {
          const policy = await apiService.getPolicy(id);
          spinner.stop();

          console.log(chalk.bold('\nPolicy Details:'));
          console.log(chalk.cyan(`  Name:        ${policy.name}`));
          console.log(chalk.gray(`  ID:          ${policy.id}`));
          console.log(chalk.gray(`  Description: ${policy.description}`));
          console.log(chalk.gray(`  Rules:       ${JSON.stringify(policy.rules, null, 2)}`));
        } catch (error) {
          spinner.stop();
          console.error(chalk.red(`Failed to load policy ${id}`));
          logger.error({ error, id }, 'Failed to load policy');
          console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          process.exit(1);
        }
      }),
  );
