import { Command } from 'commander';

import { renderInk } from '../ink/render';
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
  );
