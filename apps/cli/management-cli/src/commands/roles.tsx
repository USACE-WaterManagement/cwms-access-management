import { Command } from 'commander';

import { renderInk } from '../ink/render';
import { RoleDetailsScreen } from '../ink/screens/role-details';
import { RolesListScreen } from '../ink/screens/roles-list';

export const rolesCommand = new Command('roles')
  .description('Manage roles')
  .addCommand(
    new Command('list').description('List all roles').action(async () => {
      await renderInk(<RolesListScreen />);
    }),
  )
  .addCommand(
    new Command('show')
      .description('Show role details')
      .argument('<id>', 'Role ID to show')
      .action(async (id: string) => {
        await renderInk(<RoleDetailsScreen roleId={id} />);
      }),
  );
