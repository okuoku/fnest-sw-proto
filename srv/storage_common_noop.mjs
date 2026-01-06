export async function storage_common_noop(){
    const gitcache = {
        ref: async function ref(oid){
            console.log("(noop cache) Ref", oid);
            return false;
        },
        set: async function set(oid, type, obj){
            console.log("(noop cache) Set", oid, type, obj);
            return null;
        },
        del: async function del(oid){
            throw "unimpl";
        }


    };
    const sysdata = {};
    return { gitcache, sysdata };
}
