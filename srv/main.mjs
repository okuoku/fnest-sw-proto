import {webgitForgejo} from "../webgit/forgejo.mjs";
import {gitobjcache} from "./gitobjcache.mjs";

let cfg = null;
let stg = null;

async function run(){
    const uri = cfg[0].baseuri;
    const hdrs = cfg[0].headers;
    const repos = [];

    for(const idx in cfg[0].repositories){
        repos.push(idx);
    }

    console.log("Loading refs/heads/master", repos[0]);

    const wg = webgitForgejo(uri, repos[0], hdrs);
    const git = gitobjcache(wg, stg.gitcache);
    const ref = await wg.ResolveRef("refs/heads/master");
    console.log("Ref", ref);
    const commit = await git.ref("commit", ref);
    console.log("Commit", commit);
    async function itr(t){
        console.log("Tree", t);
        const tree = await git.ref("tree", t);
        for(const idx in tree.content){
            const e = tree.content[idx];
            if(e.type == "tree"){
                console.log("Enter", e.oid);
                await itr(e.oid);
            }
        }
    }
    await itr(commit.tree);
}

export function main(storage, config){
    cfg = config;
    stg = storage;
    run();
    return async function message_callback(){
    }
};
