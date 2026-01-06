// Service worker version of bootstrapper
import {main} from "./srv/main.mjs";
import {storage} from "./storage_sw.mjs";

/* Debug noop storage */
//import {storage_common_noop} from "./srv/storage_common_noop.mjs";
//const storage = storage_common_noop;

let cfg = false;
let cfgwaits = [];
let cb = false;

function realize_config(){
    return new Promise((res) => {
        if(cfg){
            console.log("Already configured", cfg);
            res(cfg);
        }else{
            console.log("Waiting for configuration...");
            cfgwaits.push(res);
        }
    });
}

async function realize_system(){
    if(!cb){
        const stg = await storage();
        if(!cfg){
            try {
                await realize_config();
            } catch (e) {
                console.log("(config) Fatal error", e);
            }
        }
        console.log("REALIZE...");
        cb = await main(stg, cfg);
        console.log("REALIZE DONE...", cb);
    }
}

/* Callbacks */
async function cb_install(ev){
    console.log("SW install");
    return true;
}

async function cb_message(ev){ /* Fire and Forget messaging */
    console.log("SW message", ev);
    const msg = ev.data;
    if(msg.request == "configure"){
        cfg = msg.config;
        cfgwaits.forEach(e => e(cfg));
        console.log("SW Config", cfg);
    }
    return true;
}

async function cb_fetch(ev){
    try {
        const re_ext = /^\/ext\//;
        const req = ev.request;
        const url = new URL(req.url);
        console.log("SW fetch", ev);
        if(url.pathname.match(re_ext)){
            console.log("EXT req", url.pathname);
            if(! cb){
                console.log("System init...");
                await realize_system();
                console.log("System initialized.");
            }
            console.log("Run request", req);
            return await cb(false, req);
        }else{
            // FIXME: COOP/COEP
            console.log("NW req", url.pathname);
            const res = await fetch(req);
            return res;
        }
    } catch(e) {
        console.log("(fetch) Fatal error", e);
    }
}

async function handle_fetch(ev){
    try {
        console.log("FETCH START");
        let p = cb_fetch(ev);
        for(;;){
            console.log("AWAIT", p);
            const x = await p;
            if(x instanceof Promise){
                console.log("PROMISE", x);
                p = x;
            }else{
                if(x instanceof Response){
                    // Directly return fetch() result
                    return x;
                }else{
                    // Convert to Response
                    const r = new Response(x.data, {
                        status: x.status,
                        headers: x.headers
                    });
                    console.log("RET", r);
                    return r;
                }
            }
        }
    } catch (e) {
        console.log("ERR", e);
        throw e;
    }
}

/* Event handlers */
addEventListener("install", (e) => {e.waitUntil(cb_install(e));});
addEventListener("message", cb_message);
addEventListener("fetch", (e) => {e.respondWith(handle_fetch(e));});
