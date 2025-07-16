import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

const deps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const external = id =>
  deps.some(dep => id === dep || id.startsWith(`${dep}/`))
  || /node_modules/.test(id);

export default {
  input: 'src/index.ts',
  external,
  output: {
    format: 'es',
    sourcemap: true,
    preserveModules: true,
    dir: 'dist',
  },
  plugins: [
    nodeResolve({
      extensions,
      preferBuiltins: false,
      resolveOnly: [ /^src\// ],
    }),
    babel({
      babelHelpers: 'inline',
      extensions,
      include: ['src/**/*'],
    }),
    terser(),
  ],
};
