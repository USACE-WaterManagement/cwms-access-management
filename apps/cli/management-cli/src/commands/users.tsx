import { Command } from 'commander';

import { renderInk } from '../ink/render';
import { AddUserScreen } from '../ink/screens/user-add';
import { RemoveUserScreen } from '../ink/screens/user-remove';
import { UserDetailsScreen } from '../ink/screens/user-details';
import { UsersListScreen } from '../ink/screens/users-list';

export const usersCommand = new Command('users')
  .description('Manage users')
  .addCommand(
    new Command('list').description('List all users').action(async () => {
      await renderInk(<UsersListScreen />);
    }),
  )
  .addCommand(
    new Command('show')
      .description('Show user details')
      .argument('<id>', 'User ID to show')
      .action(async (id: string) => {
        await renderInk(<UserDetailsScreen userId={id} />);
      }),
  )
  .addCommand(
    new Command('add')
      .description('Add new user')
      .option('-u, --username <username>', 'Username (alphanumeric, _, -)')
      .option('-e, --email <email>', 'Email address')
      .option('-p, --password <password>', 'Initial password (min 8 chars)')
      .option('-n, --name <name>', 'Full name')
      .option('--disabled', 'Create user as disabled (default: enabled)')
      .action(async (options) => {
        await renderInk(<AddUserScreen options={options} />);
      }),
  )
  .addCommand(
    new Command('remove')
      .description('Remove user by ID')
      .argument('<id>', 'User ID to remove')
      .option('-y, --yes', 'Skip confirmation prompt')
      .action(async (id: string, options) => {
        await renderInk(
          <RemoveUserScreen
            userId={id}
            skipConfirm={options.yes}
          />,
        );
      }),
  );
