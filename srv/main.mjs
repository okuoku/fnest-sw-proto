import {webgitForgejo} from "../webgit/forgejo.mjs";
import {gitobjcache} from "./gitobjcache.mjs";

const mounts = {};

async function realize_repo(git, tree){
    const repo = {};

    async function itr(t){
        const nodes = {};
        const tree = await git.ref("tree", t);
        for(const idx in tree.content){
            const e = tree.content[idx];
            const me = {type: "unknown"};
            if(e.type == "tree"){
                console.log("Enter", e.oid);
                const subnodes = await itr(e.oid);
                me.type = "dir";
                me.nodes = subnodes;
            }else if(e.type == "blob"){
                me.type = "file";
                me.oid = e.oid;
            }else{
                console.log("WARNING unknown node type", e);
            }
            nodes[e.name] = me;
        }
        return nodes;
    }

    const root = await itr(tree);
    return {
        type: "dir",
        nodes: root
    }
}

async function resolve_repo(webgit, git, refname){ // => tree
    console.log("Resolving...", refname);
    const ref = await webgit.ResolveRef(refname);
    console.log("Ref", ref);
    const commit = await git.ref("commit", ref);
    console.log("Commit", commit);
    return commit.tree;
}

async function init(cfg, stg){
    const uri = cfg[0].baseuri;
    const hdrs = cfg[0].headers;
    const repos = [];

    for(const idx in cfg[0].repositories){
        repos.push({reponame: idx, opts: cfg[0].repositories[idx]});
    }

    const wg = webgitForgejo(uri, repos[0].reponame, hdrs);
    const git = gitobjcache(wg, stg.gitcache);
    const tree = await resolve_repo(wg, git, "refs/heads/master");
    const repo = await realize_repo(git, tree);
    repo.root_tree = tree;
    repo.root_git = git;
    mounts[repos[0].opts.mount] = repo;
    console.log("Mounts", mounts);
}

async function the_handler(req){
    // Handles:
    //   /ext/{appName}/{path}
    //   /ext/_tree/{appName}/{tree}/{path}
    if(req.method !== "GET"){
        return {
            status: 500,
            data: "Not implemented",
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-store"
            }
        }
    }

    function notfound(){
        return {
            status: 404,
            data: "Not found",
            headers: {
                "Content-Type": "text/plain",
                "Cache-Control": "no-store"
            }
        }
    }

    function redirect(u, tree, a){
        const r = new URL(u);
        const arr = ["", "ext", "_tree", a[2] /* mount */, tree];
        const path = a.slice(3);
        const last = path.at(-1);

        if(last === ""){
            // Redirect to index.html
            path.pop();
            path.push("index.html");
        }
        const n = arr.concat(path);

        r.pathname = n.join("/");
        return r.toString();
    }

    function lookup(nodes, arr){ // => oid, false
        console.log("Lookup", arr);
        const p = nodes[arr[0]];
        console.log("P", p);
        if(p){
            if(arr.length == 1){
                if(p){
                    if(p.type === "file"){
                        return p.oid;
                    }
                }
            }else{
                lookup(p.nodes, a.slice(1));
            }
        }
        return false;
    }

    const extmap = {
        // https://github.com/neoascetic/rawgithack/blob/68d41e16912e9548feb97a55bd315cd37efef142/rawgithack.conf#L34
        csv: "text/csv",
        css: "text/css",
        html: "text/html",
        geojson: "application/vnd.geo+json",
        js: "application/javascript",
        mjs: "application/javascript",
        json: "application/json",
        otf: "font/otf",
        pdf: "application/pdf",
        svg: "image/svg+xml",
        xml: "text/xml",
        wasm: "application/wasm",

        // Other media
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",

        // VRM related
        glb: "model/gltf-binary",
        gltf: "model/gltf+json",
        vrm: "model/gltf-binary",
        vrma: "model/gltf-binary",
    }

    function exttype(basename){
        // Dotfiles are text/plain
        const i = basename.lastIndexOf(".");
        if(i==0){
            return "text/plain";
        }

        // Check extmap
        const ext = basename.slice(i+1);
        const c = extmap[ext];
        if(c){
            return c;
        }

        // Fallback to text/plain
        return "text/plain";
    }

    const url = new URL(req.url);
    const arr = url.pathname.split("/");
    console.log("REQ", arr);
    if(arr[0] === "" && arr[1] === "ext"){
        const xmount = mounts[arr[2]];
        if(xmount){
            // 302 Redirect to _tree
            const r = redirect(url, "TODO", arr);
            console.log("Redirect", r);
            return {
                status: 302,
                data: "",
                headers: {
                    Location: r
                }
            }
        }else if(arr[2] === "_tree"){
            // FIXME: Ignores tree OID in url
            // 3: Mount
            // 4: Oid
            const ymount = mounts[arr[3]];
            if(ymount){
                const oid = lookup(ymount.nodes, arr.slice(5));
                const mime = exttype(arr.at(-1));
                const git = ymount.root_git;
                if(oid){
                    console.log("OK", arr, oid, mime);
                    /* Cache for 1year, never re-request */
                    const v = await git.ref("blob", oid);
                    return {
                        status: 200,
                        data: v,
                        headers: {
                            "Cache-Control": "private, max-age=31536000, immutable",
                            "Content-Type": mime
                        }
                    }
                }else{
                    return notfound();
                }
            }else{
                return notfound();
            }
        }else{
            return notfound();
        }
    }else{
        return notfound();
    }
}

export async function main(storage, config){
    await init(config, storage);
    return async function message_callback(is_oob, req){
        if(is_oob){
            return {
                status: 500,
                data: "Not implemented",
                headers: {
                    "Content-Type": "text/plain",
                    "Cache-Control": "no-store"
                }
            }
        }else{
            return await the_handler(req);
        }
    }
};
