import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

export async function FNestServiceWorkerMain(){
    const sqlite3 = await sqlite3InitModule();

    console.log("Init", sqlite3);
}
