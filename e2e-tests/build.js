#!/usr/bin/env node

import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

async function buildTests() {
  try {
    // Ensure dist directory exists
    if (!existsSync('dist')) {
      await mkdir('dist', { recursive: true });
    }
    
    // Read playwright.config.ts
    const playwrightConfig = await readFile('playwright.config.ts', 'utf8');
    
    // Replace the teardown path
    const updatedConfig = playwrightConfig
      .replace('./global-teardown.ts', './global-teardown.js');
    
    // Write the updated config to dist
    await writeFile('dist/playwright.config.js', updatedConfig);
    
    // Build the tests with esbuild
    await build({
      entryPoints: ['tests/**/*.ts', 'global-teardown.ts'],
      outdir: 'dist',
      bundle: false,
      platform: 'node',
      format: 'esm',
      target: 'esnext',
      sourcemap: true,
      outExtension: { '.js': '.js' },
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      },
      logLevel: 'info',
    });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildTests();
