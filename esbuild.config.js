import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node\nimport { createRequire } from "module"; const require = createRequire(import.meta.url);'
  },
  // Make sure we resolve node imports correctly
  external: [],
}).then(() => {
  console.log('Build completed successfully!');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
