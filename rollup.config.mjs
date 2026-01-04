import {nodeResolve} from "@rollup/plugin-node-resolve";

export default {
    input: 'root.mjs',
    output: {
        file: 'build/sw.js',
        format: 'iife'
    },
    plugins:[
        nodeResolve(),
        {
      name: 'sw-import-meta-url',
      resolveImportMeta(property, { /* chunkId , moduleId, format */ }) {
        if (property === 'url') {
          return 'self.location.href';
        }
        return null;
      }
    }
    ]
};
