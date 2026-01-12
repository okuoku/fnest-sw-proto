import {nodeResolve} from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";

/*
function myalias(){
    const entries = [
        // https://preactjs.com/guide/v10/getting-started/#aliasing-in-rollup
        { find: 'react', replacement: 'preact/compat' },
        { find: 'react-is', replacement: 'preact/compat' },
        { find: 'react-dom/test-utils', replacement: 'preact/test-utils' },
        { find: 'react-dom', replacement: 'preact/compat' },
        { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }
    ];
    return alias(entries);
}
*/

function myreplace(){
    return replace({ preventAssignment: true,
                   "process.env.NODE_ENV": 
                   JSON.stringify(process.env.NODE_ENV ?? "development")
    });
}

export default [
    { /* Core library */
        input: "corelib_ui.mjs",
        output: {
            file: "build/corelib_ui.mjs",
            format: "es"
        },
        plugins: [ myreplace(), 
            commonjs(), /* myalias(), */ nodeResolve()]
    },
    { /* Service Worker */
        input: 'sw.mjs',
        output: {
            file: 'sw.js', /* Must be on root */
            format: 'iife'
        },
        plugins:[
            nodeResolve(),
            {
                name: 'sw-import-meta-url',
                resolveImportMeta(property, 
                                  { /* chunkId , moduleId, format */ }) {
                    if (property === 'url') {
                        return 'self.location.href';
                    }
                    return null;
                }
            }
        ]
    }];
