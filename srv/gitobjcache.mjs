export function gitobjcache(webgit, gitcache){
    return {
        ref: async function(type, oid){
            let ret;
            console.log("Cache REF...", oid);
            const pret = gitcache.ref(oid);
            console.log("Cache REF done", oid, pret);
            ret = await pret;
            if(ret){
                console.log("Cache hit", type, oid);
                if(type == "blob"){
                    return ret;
                }else{
                    return ret.data;
                }
            }else{
                const obj0 = await webgit.GetParsedObject(type, oid);
                if(obj0){
                    if(obj0.raw){
                        delete obj0.raw;
                    }
                    await gitcache.set(oid, type, obj0);
                    console.log("Save", type, oid);
                }
                return obj0;
            }
        }
    };
}
