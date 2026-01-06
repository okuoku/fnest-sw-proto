export async function storage_common_idb(){

    let db = false;
    // Init
    async function init(){
        function opendb(name, ver){
            return new Promise((res, rej) => {
                const req = indexedDB.open(name, ver);
                req.onerror = (ev) => {
                    rej(ev);
                };
                req.onupgradeneeded = (ev) => {
                    // Init schema here
                    db = ev.target.result;
                    const os = db.createObjectStore("gitcache",
                                                    {keyPath: "oid"});
                };
                req.onsuccess = (ev) => {
                    res(ev.target.result);
                };
            });
        }
        console.log("(idb) Init...");
        db = await opendb("fnest-root", 1);
        console.log("(idb) Init Done", db);
        return db;
    }

    // Interfaces (every ops are async)
    const sysdata = {}
    const gitcache = {
        ref: function ref(oid){
            return new Promise((res, rej) => {
                try {
                    console.log("Ref", oid);
                    const tx = db.transaction(["gitcache"]);
                    const os = tx.objectStore("gitcache");
                    tx.oncomplete = () => console.log('tx complete');
                    tx.onabort    = () => console.error('tx abort', tx.error);
                    tx.onerror    = () => console.error('tx error', tx.error);
                    const req = os.get(oid);
                    req.onerror = (ev) => {
                        console.log("Ref Error", oid);
                        rej(ev);
                    };
                    req.onsuccess = (ev) => {
                        const r = ev.target.result;
                        if(r && r.type == "blob"){
                            console.log("Ref", oid, "blob");
                            res(r.data);
                        }else{
                            console.log("Ref", oid, r);
                            res(r);
                        }
                    };
                    console.log("Ref Req", oid, req);
                } catch(e){
                    console.log("(idb) Fatal error", e);
                }
            });
        },
        set: function set(oid, type, obj){
            try{
                return new Promise((res, rej) => {
                    console.log("Set", db);
                    const tx = db.transaction(["gitcache"], "readwrite");
                    const os = tx.objectStore("gitcache");
                    const dat = { oid: oid, type: type, data: obj };
                    const req = os.put(dat);
                    req.onerror = (ev) => {
                        rej(ev);
                    };
                    req.onsuccess = (ev) => {
                        res();
                    };
                });
            } catch(e) {
                console.log("(idb) Fatal error", e);
            }
        },
        del: async function del(oid){
            throw "unimpl";
        }
    }

    await init();
    return { gitcache, sysdata }
}
