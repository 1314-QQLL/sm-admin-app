// ============================================================
// 数据库连接 —— 自动双模式：
//   设了 DATABASE_URL → PostgreSQL（Supabase / Render / Railway）
//   没设 DATABASE_URL → 本地 SQLite 降级（开发演示）
// 所有 export 在顶层统一导出
// ============================================================
const DATABASE_URL = process.env.DATABASE_URL

export let pool = null      // pg: Pool 实例  | sqlite: null
let _db = null              // pg: {isPg:true} | sqlite: DatabaseSync
let _isPg = false
let _initDb = async () => {}
let _isSeeded = async () => false
let _prepare = (sql) => ({ async run(){}, async get(){ return null }, async all(){ return [] } })

// ============ PostgreSQL 模式 ============
if (DATABASE_URL) {
  console.log('[db] 使用 PostgreSQL（DATABASE_URL 已配置）')
  const pg = await import('pg')
  const { Pool } = pg
  const _pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  })
  pool = _pool
  _isPg = true

  const toPgSql = (sql) => {
    let i = 0
    return sql.replace(/\?/g, () => `$${++i}`)
  }
  _prepare = function prepare(sql) {
    const pgSql = toPgSql(sql)
    return {
      async run(...args) { const r = await _pool.query(pgSql, args); return { changes: r.rowCount } },
      async get(...args) { const r = await _pool.query(pgSql, args); return r.rows[0] || null },
      async all(...args) { const r = await _pool.query(pgSql, args); return r.rows },
    }
  }
  // server.js 统一使用 db.prepare()，pg 模式下把 prepare 挂到 db 上
  _db = { isPg: true, pool, prepare: _prepare }

  const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS menus (id INTEGER PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL,icon TEXT,parent_id INTEGER,sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY,name TEXT NOT NULL,sort INTEGER DEFAULT 0,enabled BOOLEAN DEFAULT TRUE,color TEXT DEFAULT '#94a3b8',created_at TEXT);
CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY,name TEXT NOT NULL,description TEXT,enabled BOOLEAN DEFAULT TRUE,menu_perms TEXT DEFAULT '[]',op_perms TEXT DEFAULT '[]',data_scope TEXT DEFAULT 'self',created_at TEXT);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE,real_name TEXT,role_id INTEGER,department TEXT,email TEXT,phone TEXT,enabled BOOLEAN DEFAULT TRUE,password TEXT DEFAULT 'Abc@123456',last_login TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY,code TEXT NOT NULL,name TEXT NOT NULL,category_id INTEGER,owner_id INTEGER,status TEXT DEFAULT 'active',progress INTEGER DEFAULT 0,start_date TEXT,end_date TEXT,description TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,type TEXT NOT NULL,operator TEXT,ip TEXT,action TEXT,detail TEXT,result TEXT DEFAULT 'success',time TEXT);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(time);
CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY,title TEXT NOT NULL,priority TEXT DEFAULT 'medium',deadline TEXT,project TEXT,done BOOLEAN DEFAULT FALSE);
CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY,project_name TEXT,type TEXT,message TEXT,severity TEXT,days INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS system_params (id INTEGER PRIMARY KEY,key TEXT NOT NULL UNIQUE,value TEXT,description TEXT,updated_at TEXT);
CREATE TABLE IF NOT EXISTS content_items (id INTEGER PRIMARY KEY,title TEXT NOT NULL,category TEXT,author TEXT,status TEXT DEFAULT 'draft',updated_at TEXT);
CREATE TABLE IF NOT EXISTS monthly_trends (id INTEGER PRIMARY KEY,month TEXT NOT NULL,new_projects INTEGER DEFAULT 0,completed_projects INTEGER DEFAULT 0,sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS stat_card_config (id INTEGER PRIMARY KEY,title TEXT NOT NULL,icon TEXT,trend TEXT DEFAULT '[]',trend_label TEXT,color TEXT,sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS permission_nodes (id INTEGER PRIMARY KEY,parent_id INTEGER,label TEXT NOT NULL,sort INTEGER DEFAULT 0);
`
  _initDb = async function initDb() {
    const client = await _pool.connect()
    try { await client.query(SCHEMA_SQL); console.log('[db] PostgreSQL 表结构已确保存在') }
    finally { client.release() }
  }
  _isSeeded = async function isSeeded() {
    const r = await _pool.query('SELECT COUNT(*) AS c FROM users')
    return Number(r.rows[0].c) > 0
  }
}

// ============ SQLite 降级模式 ============
else {
  console.warn('[db] DATABASE_URL 未设置，使用本地 SQLite 降级（仅开发演示）')
  const { DatabaseSync } = await import('node:sqlite')
  const { fileURLToPath } = await import('node:url')
  const { dirname, join } = await import('node:path')
  const { mkdirSync, existsSync } = await import('node:fs')

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const dataDir = join(__dirname, '..', 'data')
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

  const sdb = new DatabaseSync(join(dataDir, 'sm-admin.db'))
  sdb.exec('PRAGMA journal_mode = WAL;')
  sdb.exec('PRAGMA foreign_keys = OFF;')
  sdb.exec(`
CREATE TABLE IF NOT EXISTS menus (id INTEGER PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL,icon TEXT,parent_id INTEGER,sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY,name TEXT NOT NULL,sort INTEGER DEFAULT 0,enabled INTEGER DEFAULT 1,color TEXT DEFAULT '#94a3b8',created_at TEXT);
CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY,name TEXT NOT NULL,description TEXT,enabled INTEGER DEFAULT 1,menu_perms TEXT DEFAULT '[]',op_perms TEXT DEFAULT '[]',data_scope TEXT DEFAULT 'self',created_at TEXT);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE,real_name TEXT,role_id INTEGER,department TEXT,email TEXT,phone TEXT,enabled INTEGER DEFAULT 1,password TEXT DEFAULT 'Abc@123456',last_login TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY,code TEXT NOT NULL,name TEXT NOT NULL,category_id INTEGER,owner_id INTEGER,status TEXT DEFAULT 'active',progress INTEGER DEFAULT 0,start_date TEXT,end_date TEXT,description TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT,type TEXT NOT NULL,operator TEXT,ip TEXT,action TEXT,detail TEXT,result TEXT DEFAULT 'success',time TEXT);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(time);
CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY,title TEXT NOT NULL,priority TEXT DEFAULT 'medium',deadline TEXT,project TEXT,done INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY,project_name TEXT,type TEXT,message TEXT,severity TEXT,days INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS system_params (id INTEGER PRIMARY KEY,key TEXT NOT NULL UNIQUE,value TEXT,description TEXT,updated_at TEXT);
CREATE TABLE IF NOT EXISTS content_items (id INTEGER PRIMARY KEY,title TEXT NOT NULL,category TEXT,author TEXT,status TEXT DEFAULT 'draft',updated_at TEXT);
CREATE TABLE IF NOT EXISTS monthly_trends (id INTEGER PRIMARY KEY,month TEXT NOT NULL,new_projects INTEGER DEFAULT 0,completed_projects INTEGER DEFAULT 0,sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS stat_card_config (id INTEGER PRIMARY KEY,title TEXT NOT NULL,icon TEXT,trend TEXT DEFAULT '[]',trend_label TEXT,color TEXT,sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS permission_nodes (id INTEGER PRIMARY KEY,parent_id INTEGER,label TEXT NOT NULL,sort INTEGER DEFAULT 0);
`)

  _isPg = false
  _db = sdb
  pool = null
  _prepare = function prepare(sql) {
    const stmt = sdb.prepare(sql)
    return {
      async run(...args) { return stmt.run(...args) },
      async get(...args) { return stmt.get(...args) },
      async all(...args) { return stmt.all(...args) },
    }
  }
  _initDb = async () => { /* sqlite 建表已在顶部执行 */ }
  _isSeeded = function isSeeded() { return sdb.prepare('SELECT COUNT(*) AS c FROM users').get().c > 0 }
}

// ============ 顶层统一导出 ============
export const db = _db
export const isPg = _isPg
export const prepare = _prepare
export const isSeeded = _isSeeded
export const initDb = _initDb
export default _db
