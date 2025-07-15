import { mergeConfig } from 'vite';
import type { StorybookConfig } from 'storybook-solidjs-vite';
import path from 'path';

// Define a static array of glob patterns for your stories
const stories = [
  '../stories/*.story.@(ts|tsx)',
];

export default <StorybookConfig>{
  framework: 'storybook-solidjs-vite',
  stories, // Use the static array directly
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    {
      name: '@storybook/addon-vitest',
      options: {
        cli: false,
      },
    },
  ],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          'solid-floating-ui': path.resolve(__dirname, '../src/index.ts'),
          'solid-floating-ui/*': path.resolve(__dirname, '../src/*'),
        },
      },
      define: {
        'process.env': {},
      },
      esbuild: {
        jsx: 'transform',
        jsxImportSource: 'solid-js',
      },
    });
  },
};