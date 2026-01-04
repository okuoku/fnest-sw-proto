// Node.js version of bootstrapper
import { readFile } from "node:fs/promises";
import {Hono} from "hono";
import {serve} from "@hono/node-server";
import {serveStatic} from "@hono/node-server/serve-static";
import {main} from "./srv/main.mjs";
import {storage} from "./storage_node.mjs";

const cfgfile = "./testconfig.json";
const cfg = JSON.parse(await readFile(cfgfile, "utf8"));
const PORT = 8998;

/* Polyfill btoa() and atob() */
(function (globalThis) {
    /* atob */
    if(typeof globalThis.atob !== "function"){
        globalThis.atob = (b64) =>
            Buffer.from(String(b64), "base64").toString("binary"); 
    }

    /* btoa */
    if (typeof globalThis.btoa !== "function"){
        globalThis.btoa = (bin) =>
            Buffer.from(String(bin), "binary").toString("base64");
    }
})(globalThis);

/* Serve index_node.html at 8998 */
const app = new Hono();
let cb = false;
app.get("/", async function (c) {
    const the_file = await readFile("./index_node.html", "utf8");
    return c.html(the_file);
});
app.post("/message", async function (c){
    if(cb){
        const res = await cb(true, c.req);
        return c.body(res.data, res.status, res.headers);
    }else{
        c.status(500);
        return c.text("callback not ready.")
    }
});
app.all("/ext/*", async function (c){
    if(cb){
        try {
            const res = await cb(false, c.req);
            console.log("RES", res);
            return c.body(res.data, res.status, res.headers);
        } catch (e){
            console.log("E", e);
            c.status(500);
            return c.text("??? (see console)");
        }
    }else{
        c.status(500);
        return c.text("callback not ready.")
    }
});

app.use("*", serveStatic({ root: "."}));

let serv = null;
let stg = await storage();

async function termhandler(){
    if(serv){
        serv.close();
    }
    if(stg.term){
        await stg.term();
    }
    process.exit(0);
}

process.on("SIGINT", termhandler);
process.on("SIGTERM", termhandler);

console.log("LISTEN", PORT);
serv = serve({ fetch: app.fetch, port: PORT });
cb = await main(stg, cfg);
