const swfile = "/sw.js";
const cfgfile = "/testconfig.json";

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

async function reg_new(url){
    const sw = navigator.serviceWorker;
    try {
        const reg = await sw.register(url.toString());
        reg.addEventListener("updatefound", (() => {
            console.log("Reloading...");
            window.sessionStorage.setItem("FNEST_SW_RELOADING", "update");
            //window.location.reload();
        }));
        if(reg.active && !sw.controller){
            console.log("Reloading to load page with patched header...");
            window.sessionStorage.setItem("FNEST_SW_RELOADING", "loadpage");
            window.location.reload();
        }
    } catch(e){
        console.error("Failed to register SW", e);
    }
}

async function run_mgr(){
    // FIXME: Adjust location
    const cfgurl = new URL(import.meta.url);
    const swurl = new URL(import.meta.url);
    swurl.pathname = swfile;
    cfgurl.pathname = cfgfile;
    console.log("Service worker script = ", swurl);

    const res = await fetch(cfgurl.toString());
    const config = await res.json();

    if(checkenv()){
        const sw = navigator.serviceWorker;

        function configure(){
            console.log("Configure SW...");
            sw.controller.postMessage({ request: "configure",
                                      config: config });
        }

        sw.addEventListener("controllerchange", (ev) => {
            configure();
        });

        window.sessionStorage.removeItem("FNEST_SW_RELOADING");

        if(sw.controller){
            console.log("Controller = ", sw.controller);
            configure();
            // sw.controller.postMessage({type: "deregister"});
        }else{
            await reg_new(swurl);
        }


    }else{
        console.log("Service worker not supported... aborting.");
    }

    /* Debug */
    console.log("COI status = ", window.crossOriginIsolated);
}

run_mgr();
