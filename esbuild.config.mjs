import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/index.js',
  banner: {
    js: '#!/usr/bin/env node'
  },
  // Make sure we resolve node imports correctly
  external: [],
}).then(() => {
  console.log('Build completed successfully!');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
