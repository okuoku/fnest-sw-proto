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

/* Serve index_node.html at 8998 */
const app = new Hono();
let cb_msg = false;
app.get("/", async function (c) {
    const the_file = await readFile("./index_node.html", "utf8");
    return c.html(the_file);
});
app.post("/message", async function (c){
    return c.text("");
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
cb_msg = main(stg, cfg);
