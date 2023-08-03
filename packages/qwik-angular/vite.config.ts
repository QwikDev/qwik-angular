/// <reference types="vitest" />
import { Plugin, defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { qwikVite } from '@builder.io/qwik/optimizer';
import type { OutputChunk } from 'rollup';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/qwik-angular',

  plugins: [
    qwikVite(),
    dts({
      entryRoot: 'src',
      tsConfigFilePath: path.join(__dirname, 'tsconfig.lib.json'),
      skipDiagnostics: true,
    }),

    viteTsConfigPaths({
      root: '../../',
    }),
    vitePluginFixBundle(),
  ],

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    minify: false,
    target: 'es2020',
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: [
        './src/index.qwik.ts',
        './src/lib/server.tsx',
        './src/lib/slot.ts',
        './src/vite.ts',
      ],
      name: 'qwik-angular',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
      fileName: (format, entryName) =>
        `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        '@builder.io/qwik',
        '@builder.io/qwik/build',
        '@builder.io/qwik/server',
        '@builder.io/qwik/jsx-runtime',
        '@builder.io/qwik/jsx-dev-runtime',
        '@qwik-client-manifest',
        '@vite/client',
        '@vite/env',
        'node-fetch',
        'undici',
        '@angular/platform-browser',
        '@angular/platform-browser/animations',
        '@angular/common',
        '@angular/core',
        '@angular/platform-server',
        '@analogjs/vite-plugin-angular',
        'rxjs',
        'rxjs/operators',
        'domino',
        'sass',
      ],
    },
  },
});

function vitePluginFixBundle(): Plugin {
  return {
    name: 'vite-plugin-fix-bundle',
    generateBundle(options, bundle) {
      // there're extra imports added to the index files, which breaks the library
      // removing them manually as it seems like there's no configuration option to do this
      ['index.qwik.cjs', 'index.qwik.mjs']
        .map((f) => bundle?.[f])
        .filter((c): c is OutputChunk => !!(c as OutputChunk)?.code)
        .forEach((chunk) => {
          chunk.code = chunk.code.replace(
            /^((import '.+')|(require\('.+'\)));\n/gm,
            ''
          );
        });
    },
  };
}
