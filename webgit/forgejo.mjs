export function webgitForgejo(baseurl, repository, headers){
    const prefix = baseurl + "/api/v1/";
    async function request_repos(api, param){
        const uri = prefix + "repos/" + repository + "/" + api + param;
        const res = await fetch(uri, { headers });
        const json = await res.json();
        return json;
    }
    async function request_rawblob(tree, path){
        const uri = prefix + "repos/" + repository + "/raw" + path +"?ref=" + tree;
        const res = await fetch(uri, { headers });
        console.log("REQUEST RAWBLOB", uri);
        if(res.ok){
            const bytes = await res.bytes();
            return bytes;
        }else{
            console.log("... failed", res);
            return false;
        }
    }
    return {
        Ping: async function(){
            throw "unimpl";
        },
        CurrentStatus: async function(){
            throw "unimpl";
        },
        ResolveRef: async function(refname){
            const re_refsrest = /^refs\/(.+)$/;
            const m = refname.match(re_refsrest);
            if(m){
                const nam = m[1];
                const res0 = await request_repos("/git/refs/", nam);
                return res0[0].object.sha;
            }else{
                throw "Unmatched.";
            }
        },
        CreateView: async function(commit){
            return {
                Fetch: async function(path){
                    return await request_rawblob(commit, path);
                }
            }
        },
        GetParsedObject: async function(type, oid){
            async function get_commit(){
                const res0 = await request_repos("/git/commits/", oid);
                const tree = res0.commit.tree.sha;
                return {
                    // Forgejo do not expose tree object's OID
                    tree: tree + "xTREE",
                    raw: res0
                }
            }
            async function get_tree(){
                // Extract real OID of input
                const re_treeoid = /([^x]*)xTREE/;
                const m = oid.match(re_treeoid);
                let realoid = false;
                if(m){
                    realoid = m[1];
                }else{
                    realoid = oid;
                }
                const res0 = await request_repos("/git/trees/", realoid);
                const content = res0.tree.map(e => {
                    return {
                        name: e.path,
                        mode: e.mode,
                        type: e.type,
                        size: e.size,
                        oid: e.sha
                    }
                });
                return {
                    content: content,
                    raw: res0
                }
            }
            async function get_blob(){
                const res0 = await request_repos("/git/blobs/", oid);
                if(res0.encoding != "base64"){
                    throw "Unknown encoding";
                }
                if(res0.content == "" && res0.size != 0){
                    // Large blob may be returned with null string...
                    // Fall back to raw fetch
                    return false;
                }else{
                    return atob(res0.content);
                }
            }
            switch(type){
                case "commit":
                    return get_commit();
                case "tree":
                    return get_tree();
                case "blob":
                    return get_blob();
                default:
                    throw "Unknown request";
            }
        }
    };
}
