import {webgitForgejo} from "../webgit/forgejo.mjs";
import {gitobjcache} from "./gitobjcache.mjs";

const repositories = {};

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

async function run(cfg, stg){
    const uri = cfg[0].baseuri;
    const hdrs = cfg[0].headers;
    const repos = [];

    for(const idx in cfg[0].repositories){
        repos.push(idx);
    }

    const wg = webgitForgejo(uri, repos[0], hdrs);
    const git = gitobjcache(wg, stg.gitcache);
    const tree = await resolve_repo(wg, git, "refs/heads/master");
    const repo = await realize_repo(git, tree);
    console.log("Repotree", repo);
}

export function main(storage, config){
    run(config, storage);
    return async function message_callback(){
    }
};
