import sqlite3InitModule from "./build/sqlite3.mjs";

export async function FNestServiceWorkerMain(){
    const sqlite3 = await sqlite3InitModule();

    console.log("Init", sqlite3);
}
