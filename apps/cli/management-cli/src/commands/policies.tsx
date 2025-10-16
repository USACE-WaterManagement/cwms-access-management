import { Command } from 'commander';

import { renderInk } from '../ink/render';
import { PoliciesListScreen } from '../ink/screens/policies-list';
import { PolicyDetailsScreen } from '../ink/screens/policy-details';

export const policiesCommand = new Command('policies')
  .description('Manage authorization policies')
  .addCommand(
    new Command('list').description('List all policies').action(async () => {
      await renderInk(<PoliciesListScreen />);
    }),
  )
  .addCommand(
    new Command('show')
      .description('Show policy details')
      .argument('<id>', 'Policy ID to show')
      .action(async (id: string) => {
        await renderInk(<PolicyDetailsScreen policyId={id} />);
      }),
  );
