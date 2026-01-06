/* sysdata */
const sql_sysdata_init = `CREATE TABLE IF NOT EXISTS sysdata(
  lab TEXT PRIMARY KEY,
  inf TEXT NOT NULL
) WITHOUT ROWID;
`;
const sql_sysdata_ref = "SELECT inf FROM sysdata WHERE lab=?1";
const sql_sysdata_del = "DELETE FROM sysdata WHERE lab=?1";
const sql_sysdata_enum = 
"SELECT lab FROM sysdata WHERE lab LIKE ?1 ORDER BY lab";
const sql_sysdata_set = `
INSERT INTO sysdata(lab,inf)
VALUES(?1,?2)
ON CONFLICT(lab) DO UPDATE SET
  inf=excluded.inf
`;

/* gitcache */
const sql_gitcache_init = `
CREATE TABLE IF NOT EXISTS gitcache(
  oid TEXT PRIMARY KEY,
  typ TEXT NOT NULL,
  dat BLOB NOT NULL
) WITHOUT ROWID;
`;
const sql_gitcache_ref = "SELECT * FROM gitcache WHERE oid=?1";
const sql_gitcache_del = "DELETE FROM gitcache WHERE oid=?1";
const sql_gitcache_set = `
INSERT INTO gitcache(oid,typ,dat)
VALUES(?1,?2,?3)
ON CONFLICT(oid) DO UPDATE SET
  typ=excluded.typ,
  dat=excluded.dat
`;

export async function storage_common_ops(sqlite3, db){
    /* make sure tables exist before preparing statements */
    db.exec(sql_sysdata_init);
    db.exec(sql_gitcache_init);

    /* Setup */
    const stmt_sysdata_ref = db.prepare(sql_sysdata_ref);
    const stmt_sysdata_del = db.prepare(sql_sysdata_del);
    const stmt_sysdata_enum = db.prepare(sql_sysdata_enum);
    const stmt_sysdata_set = db.prepare(sql_sysdata_set);
    const stmt_gitcache_ref = db.prepare(sql_gitcache_ref);
    const stmt_gitcache_del = db.prepare(sql_gitcache_del);
    const stmt_gitcache_set = db.prepare(sql_gitcache_set);

    function fromBlob(obj){
        return new TextDecoder("utf-8").decode(obj);
    }

    const gitcache = {
        ref: async function ref(oid){
            let type = null;
            let obj = null;
            stmt_gitcache_ref.reset(true);
            stmt_gitcache_ref.bind(1, oid);
            const res = stmt_gitcache_ref.step();
            if(res){
                type = stmt_gitcache_ref.get(1);
                obj = stmt_gitcache_ref.getBlob(2);
            }
            stmt_gitcache_ref.reset(true);
            if(res){
                if(type == "blob"){
                    return obj;
                }else{
                    const content = JSON.parse(fromBlob(obj));
                    return {
                        type: type,
                        data: content
                    }
                }
            }else{
                return false;
            }
        },
        set: async function set(oid, type, obj){
            let blob = null;
            if(type == "blob"){
                blob = obj;
            }else{
                blob = JSON.stringify(obj);
            }
            stmt_gitcache_set.reset(true);
            stmt_gitcache_set.bind(1, oid);
            stmt_gitcache_set.bind(2, type);
            stmt_gitcache_set.bindAsBlob(3, blob);
            stmt_gitcache_set.step();
            stmt_gitcache_set.reset(true);
        },
        del: async function del(oid){
            stmt_gitcache_del.reset(true);
            stmt_gitcache_del.bind(1, oid);
            stmt_gitcache_del.step();
            stmt_gitcache_del.reset(true);
        }
    }

    const sysdata = {};

    return { gitcache, sysdata };
}
