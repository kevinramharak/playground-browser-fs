import typescript from '@rollup/plugin-typescript';
import node from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import globals from 'rollup-plugin-node-globals';
import externalGlobals from "rollup-plugin-external-globals";

import path from 'path';

// You can have more root bundles by extending this array
const rootFiles = ['index.ts'];

export default rootFiles.map(name => {
  /** @type { import("rollup").RollupOptions } */
  const options = {
    input: `src/${name}`,
    external: ['typescript'],
    output: {
      name,
      dir: 'dist',
      format: 'amd',
      esModule: false,
      sourcemap: false || process.env.NODE_ENV === 'production' ? false : 'inline',
    },
    plugins: [
      typescript({ tsconfig: 'tsconfig.json' }),
      externalGlobals({ typescript: "window.ts" }),
      alias({
        entries: [
          {
            find: 'fs',
            replacement: path.resolve(__dirname, 'src/shims/fs.ts'),
          },
          {
            find: 'path',
            replacement: path.resolve(__dirname, 'src/shims/path.ts'),
          },
          {
            find: 'buffer',
            replacement: path.resolve(__dirname, 'src/shims/buffer.ts'),
          },
          {
            find: 'process',
            replacement: path.resolve(__dirname, 'src/shims/process.ts'),
          },
        ],
      }),
      commonjs(),
      globals({
        process: true,
        global: false,
        buffer: false,
        dirname: false,
        filename: false,
      }),
      node(),
      json()
    ],
  }

  return options
})

