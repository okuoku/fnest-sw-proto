import {nodeResolve} from "@rollup/plugin-node-resolve";

export default {
    input: 'sw.mjs',
    output: {
        file: 'sw.js',
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
