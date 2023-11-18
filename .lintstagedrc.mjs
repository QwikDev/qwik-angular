import { relative } from 'path';
import { workspaceRoot } from '@nx/devkit';

export default {
  '**/*': (files) =>
    `pnpx nx format:write --files=${files
      .map((f) => relative(workspaceRoot, f))
      .join(',')}`,
  '{apps,libs,packages,tools}/**/*.{ts,tsx,js,jsx}': 'eslint',
};
