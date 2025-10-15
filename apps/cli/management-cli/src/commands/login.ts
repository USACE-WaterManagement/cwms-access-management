import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import axios from 'axios';

import { logger } from '../utils/logger';
import { getConfig, saveConfig } from '../utils/config';

export const loginCommand = new Command('login')
  .description('Login to CWMS management API')
  .option('-u, --username <username>', 'Admin username')
  .option('-p, --password <password>', 'Admin password')
  .option('-a, --api-url <url>', 'Management API URL', process.env.MANAGEMENT_API_URL || 'http://localhost:3002')
  .action(async (options) => {
    const spinner = ora('Authenticating...').start();

    try {
      const username = options.username || process.env.KEYCLOAK_ADMIN_USER || 'admin';
      const password = options.password || process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';
      const apiUrl = options.apiUrl;

      const response = await axios.post(`${apiUrl}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        const { token } = response.data.data;

        saveConfig({
          token,
          username,
          apiUrl,
        });

        spinner.stop();
        console.log(chalk.green('Login successful'));
        console.log(chalk.cyan(`Logged in as: ${username}`));
        console.log(chalk.gray('Token saved to ~/.cwms-admin/config.json'));
      } else {
        spinner.stop();
        console.error(chalk.red('Login failed'));
        console.error(chalk.red(response.data.error || 'Unknown error'));
        process.exit(1);
      }
    } catch (error) {
      spinner.stop();
      console.error(chalk.red('Login failed'));
      logger.error({ error }, 'Failed to login');

      if (axios.isAxiosError(error) && error.response) {
        console.error(chalk.red(`Error: ${error.response.data?.error || error.message}`));
      } else {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }

      process.exit(1);
    }
  });

export const logoutCommand = new Command('logout')
  .description('Logout from CWMS management API')
  .action(() => {
    const config = getConfig();

    if (!config.token) {
      console.log(chalk.yellow('Not logged in'));

      return;
    }

    saveConfig({});
    console.log(chalk.green('Logged out successfully'));
  });
