// https://babeljs.io/docs/en/configuration
const presets = ['@babel/preset-typescript', 'babel-preset-solid']
if (process.env['BABEL_ENV'] === 'es') {
  presets.unshift(['@babel/preset-env', { modules: false }])
} else {
  presets.unshift('@babel/preset-env')
}

const plugins = [
  '@babel/plugin-proposal-export-default-from',
  '@babel/plugin-proposal-logical-assignment-operators',
  ['@babel/plugin-proposal-optional-chaining', { loose: false }],
  ['@babel/plugin-proposal-pipeline-operator', { proposal: 'minimal' }],
  ['@babel/plugin-proposal-nullish-coalescing-operator', { loose: false }],
  '@babel/plugin-proposal-do-expressions',
  'add-module-exports',
]

if (process.env['BABEL_ENV'] === 'es') {
  plugins.push(['add-import-extension', { extension: 'js' }])
}

export default {
  presets,
  plugins,
  env: {
    test: {
      presets,
      plugins: [...plugins, '@babel/plugin-transform-runtime', 'dynamic-import-node']
    }
  }
}