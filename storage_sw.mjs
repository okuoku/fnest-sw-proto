import {storage_common_idb} from "./srv/storage_common_idb.mjs";

export async function storage(){
    try {
        const ops = await storage_common_idb();
        return ops;
    } catch(e){
        console.log("(storage) Fatal error", e);
    }
}
