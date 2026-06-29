import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/index.js',
  sourcemap: false,
  minify: true,
  treeShaking: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  // Keep node built-in modules external — they're available at runtime
  external: [],
}).then(() => {
  console.log('Build completed successfully! (minified + tree-shaken)');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});