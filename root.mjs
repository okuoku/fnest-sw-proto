import {FNestServiceWorkerMain} from "./sw.mjs";

const FNEST_SW_VERSION = 20251231_00; /* FIXME: Implement comparison logic */

/* Service worker management for Window */
function checkenv(){
    if(!window.isSecureContext){
        console.log("Not in secure context!");
        return false;
    }
    if(!navigator.serviceWorker){
        console.log("sw is not available!");
        return false;
    }
    return true;
}

async function run_mgr(){
    if(checkenv()){
        const n = navigator;
        const sw = n.serviceWorker;

        window.sessionStorage.removeItem("FNEST_SW_RELOADING");

        if(sw.controller){
            // sw.controller.postMessage({type: "deregister"});
        }

        try {
            const reg = await sw.register(window.document.currentScript.src);
            reg.addEventListener("updatefound", (() => {
                console.log("Reloading...");
                window.sessionStorage.setItem("FNEST_SW_RELOADING", "update");
                //window.location.reload();
            }));
            if(reg.active && !sw.controller){
                console.log("Reloading to load page...");
                window.sessionStorage.setItem("FNEST_SW_RELOADING", "loadpage");
                //window.location.reload();
            }

        } catch(e){
            console.error("Failed to register SW", e);
        }
    }

    /* Debug */
    console.log("COI status = ", window.crossOriginIsolated);
}

/* Entry point */
if(typeof window === "undefined"){
    FNestServiceWorkerMain();
}else{
    run_mgr();
}
