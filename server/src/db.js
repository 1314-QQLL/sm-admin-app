// ============================================================
// SQLite 数据库连接与表结构（使用 Node 内置 node:sqlite，无需安装）
// ============================================================
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

export const DB_PATH = join(dataDir, 'sm-admin.db')
export const db = new DatabaseSync(DB_PATH)

db.exec('PRAGMA journal_mode = WAL;')
db.exec('PRAGMA foreign_keys = OFF;')

// 建表（如不存在）
db.exec(`
CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT,
  parent_id INTEGER,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  sort INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  color TEXT DEFAULT '#94a3b8',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled INTEGER DEFAULT 1,
  menu_perms TEXT DEFAULT '[]',
  op_perms TEXT DEFAULT '[]',
  data_scope TEXT DEFAULT 'self',
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  real_name TEXT,
  role_id INTEGER,
  department TEXT,
  email TEXT,
  phone TEXT,
  enabled INTEGER DEFAULT 1,
  password TEXT DEFAULT 'Abc@123456',
  last_login TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER,
  owner_id INTEGER,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,           -- login | operation | exception
  operator TEXT,
  ip TEXT,
  action TEXT,
  detail TEXT,
  result TEXT DEFAULT 'success',
  time TEXT
);
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(time);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  deadline TEXT,
  project TEXT,
  done INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY,
  project_name TEXT,
  type TEXT,
  message TEXT,
  severity TEXT,
  days INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS system_params (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  author TEXT,
  status TEXT DEFAULT 'draft',
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS monthly_trends (
  id INTEGER PRIMARY KEY,
  month TEXT NOT NULL,
  new_projects INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stat_card_config (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  trend TEXT DEFAULT '[]',
  trend_label TEXT,
  color TEXT,
  sort INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS permission_nodes (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER,
  label TEXT NOT NULL,
  sort INTEGER DEFAULT 0
);
`)

// 判断是否已初始化（以 users 表数据为准）
export function isSeeded() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM users').get()
  return row.c > 0
}
