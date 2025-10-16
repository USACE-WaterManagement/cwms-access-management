import { render } from 'ink';
import type { ReactElement } from 'react';

export async function renderInk(element: ReactElement): Promise<void> {
  const { waitUntilExit } = render(element);

  await waitUntilExit();
}
