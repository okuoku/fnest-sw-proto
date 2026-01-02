import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {readFile, writeFile} from "node:fs/promises";
import {storage_common_ops} from "./srv/storage_common.mjs";

// From: https://sqlite.org/wasm/doc/trunk/cookbook.md#impexp
function loaddb(sqlite3, db, buf){
    /* Load to Wasm Heap */
    const p = sqlite3.wasm.allocFromTypedArray(buf);

    /* Init DB */
    const rc = sqlite3.capi
        .sqlite3_deserialize(
                             db.pointer, 'main', p,
                             buf.byteLength, buf.byteLength,
                             sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
                             sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
        );
    db.checkRc(rc);
}

function savedb(sqlite3, db){ // => buf
    return sqlite3.capi.sqlite3_js_db_export(db);
}

export async function storage() {
    const sqlite3 = await sqlite3InitModule();
    const db = new sqlite3.oo1.DB(":memory:", "c");
    {
        let buf = false;
        try{
            buf = await readFile("./state.db");
        }catch(e){
            console.log("(node-stub) Initialize with empty DB.",e.code);
        }
        if(buf){
            const arr = new Uint8Array(buf);
            console.log("(node-stub) Loading previous state...");
            loaddb(sqlite3, db, arr);
            console.log("(node-stub) ... Done.");
        }
    }

    const ops = storage_common_ops(sqlite3, db);
    async function terminate(){ /* Node.js only */
        const wbuf = savedb(sqlite3, db);
        console.log("(node-stub) Terminating storage...");
        await writeFile("./state.db", wbuf);
        console.log("(node-stub) ... Done.");
    }
    ops.term = terminate;
    return ops;
}
