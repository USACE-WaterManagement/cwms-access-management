import { Command } from 'commander';

import { renderInk } from '../ink/render';
import { AddRoleScreen } from '../ink/screens/role-add';
import { RoleDetailsScreen } from '../ink/screens/role-details';
import { RemoveRoleScreen } from '../ink/screens/role-remove';
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
  )
  .addCommand(
    new Command('add')
      .description('Add a new role')
      .option('-n, --name <name>', 'Role name (snake_case)')
      .option('-d, --description <description>', 'Role description (optional)')
      .action(async (options: { name?: string; description?: string }) => {
        await renderInk(<AddRoleScreen options={options} />);
      }),
  )
  .addCommand(
    new Command('remove')
      .description('Remove a role')
      .argument('<id>', 'Role ID to remove')
      .option('-y, --yes', 'Skip confirmation prompt')
      .action(async (id: string, options: { yes?: boolean }) => {
        await renderInk(
          <RemoveRoleScreen
            roleId={id}
            skipConfirm={options.yes}
          />,
        );
      }),
  );
