export function webgitForgejo(baseurl, repository, headers){
    const prefix = baseurl + "/api/v1/";
    async function request_repos(api, param){
        const uri = prefix + "repos/" + repository + "/" + api + param;
        const res = await fetch(uri, { headers });
        return await res.json();
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
            throw "unimpl";
            return {
                Fetch: async function(path){
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
                throw "unimpl";
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
