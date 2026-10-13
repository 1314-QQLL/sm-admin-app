// ============================================================
// 综合管理平台后端 API 服务
// Node.js + Express + 内置 SQLite(node:sqlite)
// 启动: npm start   端口: 3001
// ============================================================
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { db, isSeeded } from './db.js'
import { execSync } from 'node:child_process'

// 首次启动自动初始化种子数据
if (!isSeeded()) {
  console.log('数据库为空，自动初始化种子数据...')
  execSync('node src/seed.js', { cwd: join(dirname(fileURLToPath(import.meta.url)), '..'), stdio: 'inherit' })
}

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------- 工具函数 ----------
const nowStr = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const todayStr = () => nowStr().slice(0, 10)
const nextId = (table) => (db.prepare(`SELECT COALESCE(MAX(id),0)+1 AS n FROM ${table}`).get().n)
const parseJson = (s, fallback) => { try { return JSON.parse(s) ?? fallback } catch { return fallback } }
const operatorOf = (req) => {
  // HTTP 头只允许 Latin-1，前端用 encodeURIComponent 传递中文操作人
  const raw = req.get('x-operator')
  if (raw) { try { return decodeURIComponent(raw) } catch { return raw } }
  return '系统管理员'
}
const ipOf = (req) => req.get('x-forwarded-for') || req.ip?.replace('::ffff:', '') || req.socket.remoteAddress || '127.0.0.1'

// 写操作日志（业务操作自动留痕，可在"日志监控-操作日志"查看）
const addOperationLog = (req, action, detail, result = 'success') => {
  db.prepare('INSERT INTO logs (type,operator,ip,action,detail,result,time) VALUES (?,?,?,?,?,?,?)')
    .run('operation', operatorOf(req), ipOf(req), action, detail, result, nowStr())
}

// ---------- 行映射（数据库列名 -> 前端驼峰字段） ----------
const mapMenu = (r) => ({ id: r.id, name: r.name, path: r.path, icon: r.icon, parentId: r.parent_id, sort: r.sort })
const mapCategory = (r) => ({ id: r.id, name: r.name, sort: r.sort, enabled: !!r.enabled, color: r.color, createdAt: r.created_at })
const mapUser = (r) => ({
  id: r.id, username: r.username, realName: r.real_name, roleId: r.role_id, roleName: r.role_name,
  department: r.department, email: r.email, phone: r.phone, enabled: !!r.enabled,
  lastLogin: r.last_login, createdAt: r.created_at,
})
const mapProject = (r) => ({
  id: r.id, code: r.code, name: r.name, categoryId: r.category_id, categoryName: r.category_name,
  ownerId: r.owner_id, ownerName: r.owner_name, status: r.status, progress: r.progress,
  startDate: r.start_date, endDate: r.end_date, description: r.description,
})
const mapRole = (r) => ({
  id: r.id, name: r.name, description: r.description, enabled: !!r.enabled,
  userCount: r.user_count ?? 0,
  permissions: { menus: parseJson(r.menu_perms, []), operations: parseJson(r.op_perms, []), dataScope: r.data_scope },
})
const mapLog = (r) => ({ id: r.id, type: r.type, operator: r.operator, ip: r.ip, action: r.action, detail: r.detail, result: r.result, time: r.time })
const mapTodo = (r) => ({ id: r.id, title: r.title, priority: r.priority, deadline: r.deadline, project: r.project, done: !!r.done })
const mapAlert = (r) => ({ id: r.id, projectName: r.project_name, type: r.type, message: r.message, severity: r.severity, days: r.days })
const mapParam = (r) => ({ id: r.id, key: r.key, value: r.value, description: r.description, updatedAt: r.updated_at })
const mapContent = (r) => ({ id: r.id, title: r.title, category: r.category, author: r.author, status: r.status, updatedAt: r.updated_at })

// ---------- 查询语句 ----------
const userSelect = `
  SELECT u.*, r.name AS role_name FROM users u
  LEFT JOIN roles r ON r.id = u.role_id`
const projectSelect = `
  SELECT p.*, c.name AS category_name, u.real_name AS owner_name FROM projects p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN users u ON u.id = p.owner_id`

// ============================================================
// 菜单
// ============================================================
app.get('/api/menus', (_req, res) => {
  res.json(db.prepare('SELECT * FROM menus ORDER BY sort').all().map(mapMenu))
})

// ============================================================
// 权限树
// ============================================================
app.get('/api/permissions/tree', (_req, res) => {
  const parents = db.prepare('SELECT * FROM permission_nodes WHERE parent_id IS NULL ORDER BY sort').all()
  const childStmt = db.prepare('SELECT * FROM permission_nodes WHERE parent_id = ? ORDER BY sort')
  res.json(parents.map((p) => ({
    id: p.id,
    label: p.label,
    children: childStmt.all(p.id).map((c) => ({ id: c.id, label: c.label, parent: p.label })),
  })))
})

// ============================================================
// 分类
// ============================================================
app.get('/api/categories', (_req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort, id').all().map(mapCategory))
})
app.post('/api/categories', (req, res) => {
  const { name, sort = 0, enabled = true, color = '#94a3b8' } = req.body
  if (!name) return res.status(400).json({ message: '分类名称不能为空' })
  const id = nextId('categories')
  db.prepare('INSERT INTO categories (id,name,sort,enabled,color,created_at) VALUES (?,?,?,?,?,?)')
    .run(id, name, sort, enabled ? 1 : 0, color, todayStr())
  addOperationLog(req, '新增分类', `新增项目分类「${name}」`)
  res.status(201).json(mapCategory(db.prepare('SELECT * FROM categories WHERE id=?').get(id)))
})
app.put('/api/categories/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM categories WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '分类不存在' })
  const { name, sort, enabled, color } = req.body
  db.prepare('UPDATE categories SET name=?,sort=?,enabled=?,color=? WHERE id=?')
    .run(name ?? cur.name, sort ?? cur.sort, enabled === undefined ? cur.enabled : (enabled ? 1 : 0), color ?? cur.color, id)
  addOperationLog(req, '编辑分类', `修改分类「${name ?? cur.name}」`)
  res.json(mapCategory(db.prepare('SELECT * FROM categories WHERE id=?').get(id)))
})
app.delete('/api/categories/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM categories WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '分类不存在' })
  db.prepare('DELETE FROM categories WHERE id=?').run(Number(req.params.id))
  addOperationLog(req, '删除分类', `删除分类「${cur.name}」`)
  res.json({ ok: true })
})

// ============================================================
// 角色
// ============================================================
app.get('/api/roles', (_req, res) => {
  const rows = db.prepare(`
    SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS user_count
    FROM roles r ORDER BY r.id`).all()
  res.json(rows.map(mapRole))
})
app.post('/api/roles', (req, res) => {
  const { name, description = '' } = req.body
  if (!name) return res.status(400).json({ message: '角色名称不能为空' })
  const id = nextId('roles')
  db.prepare('INSERT INTO roles (id,name,description,enabled,menu_perms,op_perms,data_scope,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, name, description, 1, '[]', '[]', 'self', todayStr())
  addOperationLog(req, '新增角色', `创建角色「${name}」`)
  res.status(201).json(mapRole(db.prepare(`
    SELECT r.*, 0 AS user_count FROM roles r WHERE r.id=?`).get(id)))
})
app.put('/api/roles/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM roles WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '角色不存在' })
  const { name, description, enabled, permissions } = req.body
  const menuPerms = permissions?.menus !== undefined ? JSON.stringify(permissions.menus) : cur.menu_perms
  const opPerms = permissions?.operations !== undefined ? JSON.stringify(permissions.operations) : cur.op_perms
  const dataScope = permissions?.dataScope ?? cur.data_scope
  db.prepare('UPDATE roles SET name=?,description=?,enabled=?,menu_perms=?,op_perms=?,data_scope=? WHERE id=?')
    .run(name ?? cur.name, description ?? cur.description, enabled === undefined ? cur.enabled : (enabled ? 1 : 0),
      menuPerms, opPerms, dataScope, id)
  addOperationLog(req, '权限配置', `修改角色「${name ?? cur.name}」权限配置`)
  const row = db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id=r.id) AS user_count FROM roles r WHERE r.id=?`).get(id)
  res.json(mapRole(row))
})
app.patch('/api/roles/:id/enabled', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM roles WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '角色不存在' })
  const enabled = req.body.enabled ? 1 : 0
  db.prepare('UPDATE roles SET enabled=? WHERE id=?').run(enabled, id)
  addOperationLog(req, enabled ? '启用角色' : '停用角色', `${enabled ? '启用' : '停用'}角色「${cur.name}」`)
  res.json({ ok: true, enabled: !!enabled })
})
app.delete('/api/roles/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM roles WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '角色不存在' })
  const used = db.prepare('SELECT COUNT(*) AS c FROM users WHERE role_id=?').get(cur.id).c
  if (used > 0) return res.status(400).json({ message: `该角色下仍有 ${used} 个用户，无法删除` })
  db.prepare('DELETE FROM roles WHERE id=?').run(cur.id)
  addOperationLog(req, '删除角色', `删除角色「${cur.name}」`)
  res.json({ ok: true })
})

// ============================================================
// 用户
// ============================================================
app.get('/api/users', (_req, res) => {
  res.json(db.prepare(`${userSelect} ORDER BY u.id`).all().map(mapUser))
})
app.post('/api/users', (req, res) => {
  const b = req.body
  if (!b.username || !b.realName) return res.status(400).json({ message: '用户名和姓名不能为空' })
  if (db.prepare('SELECT id FROM users WHERE username=?').get(b.username)) {
    return res.status(409).json({ message: `用户名「${b.username}」已存在` })
  }
  const id = nextId('users')
  db.prepare(`INSERT INTO users (id,username,real_name,role_id,department,email,phone,enabled,password,last_login,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.username, b.realName, Number(b.roleId) || null, b.department ?? '', b.email ?? '', b.phone ?? '',
      1, b.password || 'Abc@123456', '-', todayStr())
  addOperationLog(req, '新增用户', `创建用户「${b.username}」(${b.realName})`)
  res.status(201).json(mapUser(db.prepare(`${userSelect} WHERE u.id=?`).get(id)))
})
app.put('/api/users/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  const b = req.body
  db.prepare(`UPDATE users SET username=?,real_name=?,role_id=?,department=?,email=?,phone=? WHERE id=?`)
    .run(b.username ?? cur.username, b.realName ?? cur.real_name,
      b.roleId !== undefined ? Number(b.roleId) : cur.role_id,
      b.department ?? cur.department, b.email ?? cur.email, b.phone ?? cur.phone, id)
  addOperationLog(req, '编辑用户', `修改用户「${b.realName ?? cur.real_name}」信息`)
  res.json(mapUser(db.prepare(`${userSelect} WHERE u.id=?`).get(id)))
})
app.patch('/api/users/:id/enabled', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  const enabled = req.body.enabled ? 1 : 0
  db.prepare('UPDATE users SET enabled=? WHERE id=?').run(enabled, id)
  addOperationLog(req, enabled ? '启用用户' : '停用用户', `${enabled ? '启用' : '停用'}用户「${cur.real_name}」`)
  res.json({ ok: true, enabled: !!enabled })
})
app.post('/api/users/:id/reset-password', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  db.prepare('UPDATE users SET password=? WHERE id=?').run('Abc@123456', id)
  addOperationLog(req, '重置密码', `重置用户「${cur.real_name}」密码为默认密码`)
  res.json({ ok: true, defaultPassword: 'Abc@123456' })
})
app.delete('/api/users/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  if (id === 1) return res.status(400).json({ message: '超级管理员账户不可删除' })
  db.prepare('DELETE FROM users WHERE id=?').run(id)
  addOperationLog(req, '删除用户', `删除用户「${cur.real_name}」`)
  res.json({ ok: true })
})

// ============================================================
// 项目
// ============================================================
app.get('/api/projects', (_req, res) => {
  res.json(db.prepare(`${projectSelect} ORDER BY p.id DESC`).all().map(mapProject))
})
app.post('/api/projects', (req, res) => {
  const b = req.body
  if (!b.name || !b.code) return res.status(400).json({ message: '项目编号和名称不能为空' })
  const id = nextId('projects')
  db.prepare(`INSERT INTO projects (id,code,name,category_id,owner_id,status,progress,start_date,end_date,description,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.code, b.name, Number(b.categoryId) || null, Number(b.ownerId) || null,
      b.status || 'active', Number(b.progress) || 0, b.startDate || '', b.endDate || '', b.description || '', todayStr())
  addOperationLog(req, '新增项目', `创建项目「${b.name}」(${b.code})`)
  res.status(201).json(mapProject(db.prepare(`${projectSelect} WHERE p.id=?`).get(id)))
})
app.put('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '项目不存在' })
  const b = req.body
  db.prepare(`UPDATE projects SET code=?,name=?,category_id=?,owner_id=?,progress=?,start_date=?,end_date=?,description=? WHERE id=?`)
    .run(b.code ?? cur.code, b.name ?? cur.name,
      b.categoryId !== undefined ? Number(b.categoryId) : cur.category_id,
      b.ownerId !== undefined ? Number(b.ownerId) : cur.owner_id,
      b.progress !== undefined ? Number(b.progress) : cur.progress,
      b.startDate ?? cur.start_date, b.endDate ?? cur.end_date, b.description ?? cur.description, id)
  addOperationLog(req, '编辑项目', `修改项目「${b.name ?? cur.name}」信息`)
  res.json(mapProject(db.prepare(`${projectSelect} WHERE p.id=?`).get(id)))
})
app.patch('/api/projects/:id/status', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '项目不存在' })
  const { status } = req.body
  if (!['active', 'disabled', 'archived'].includes(status)) return res.status(400).json({ message: '非法状态' })
  db.prepare('UPDATE projects SET status=? WHERE id=?').run(status, id)
  const label = { active: '启用', disabled: '禁用', archived: '归档' }[status]
  addOperationLog(req, '状态变更', `将项目「${cur.name}」状态变更为${label}`)
  res.json({ ok: true, status })
})
app.delete('/api/projects/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '项目不存在' })
  db.prepare('DELETE FROM projects WHERE id=?').run(id)
  addOperationLog(req, '删除项目', `删除项目「${cur.name}」(${cur.code})`)
  res.json({ ok: true })
})

// ============================================================
// 日志
// ============================================================
app.get('/api/logs', (req, res) => {
  const { type } = req.query
  const rows = type
    ? db.prepare('SELECT * FROM logs WHERE type=? ORDER BY time DESC, id DESC').all(String(type))
    : db.prepare('SELECT * FROM logs ORDER BY time DESC, id DESC').all()
  res.json(rows.map(mapLog))
})
app.post('/api/logs', (req, res) => {
  const b = req.body
  const id = db.prepare('INSERT INTO logs (type,operator,ip,action,detail,result,time) VALUES (?,?,?,?,?,?,?)')
    .run(b.type || 'operation', b.operator || operatorOf(req), b.ip || ipOf(req),
      b.action || '', b.detail || '', b.result || 'success', b.time || nowStr())
  res.status(201).json({ id: Number(id.lastInsertRowid) })
})

// ============================================================
// 待办 / 预警
// ============================================================
app.get('/api/todos', (_req, res) => {
  res.json(db.prepare('SELECT * FROM todos ORDER BY done, id').all().map(mapTodo))
})
app.patch('/api/todos/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM todos WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '待办不存在' })
  const done = req.body.done ? 1 : 0
  db.prepare('UPDATE todos SET done=? WHERE id=?').run(done, id)
  res.json({ ok: true, done: !!done })
})
app.get('/api/alerts', (_req, res) => {
  res.json(db.prepare('SELECT * FROM alerts ORDER BY id').all().map(mapAlert))
})

// ============================================================
// 系统参数
// ============================================================
app.get('/api/params', (_req, res) => {
  res.json(db.prepare('SELECT * FROM system_params ORDER BY id').all().map(mapParam))
})
app.post('/api/params', (req, res) => {
  const { key, value, description = '' } = req.body
  if (!key || value === undefined) return res.status(400).json({ message: '参数键和值不能为空' })
  const id = nextId('system_params')
  db.prepare('INSERT INTO system_params (id,key,value,description,updated_at) VALUES (?,?,?,?,?)')
    .run(id, key, String(value), description, todayStr())
  addOperationLog(req, '系统设置', `新增系统参数「${key}」`)
  res.status(201).json(mapParam(db.prepare('SELECT * FROM system_params WHERE id=?').get(id)))
})
app.put('/api/params/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM system_params WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '参数不存在' })
  const { key, value, description } = req.body
  db.prepare('UPDATE system_params SET key=?,value=?,description=?,updated_at=? WHERE id=?')
    .run(key ?? cur.key, value !== undefined ? String(value) : cur.value, description ?? cur.description, todayStr(), id)
  addOperationLog(req, '系统设置', `修改系统参数「${key ?? cur.key}」`)
  res.json(mapParam(db.prepare('SELECT * FROM system_params WHERE id=?').get(id)))
})
app.delete('/api/params/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM system_params WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '参数不存在' })
  db.prepare('DELETE FROM system_params WHERE id=?').run(cur.id)
  addOperationLog(req, '系统设置', `删除系统参数「${cur.key}」`)
  res.json({ ok: true })
})

// ============================================================
// 内容
// ============================================================
app.get('/api/content', (_req, res) => {
  res.json(db.prepare('SELECT * FROM content_items ORDER BY id DESC').all().map(mapContent))
})
app.post('/api/content', (req, res) => {
  const b = req.body
  if (!b.title) return res.status(400).json({ message: '内容标题不能为空' })
  const id = nextId('content_items')
  db.prepare('INSERT INTO content_items (id,title,category,author,status,updated_at) VALUES (?,?,?,?,?,?)')
    .run(id, b.title, b.category ?? '管理制度', b.author ?? '系统管理员', b.status || 'draft', todayStr())
  addOperationLog(req, '新增内容', `新增内容「${b.title}」`)
  res.status(201).json(mapContent(db.prepare('SELECT * FROM content_items WHERE id=?').get(id)))
})
app.put('/api/content/:id', (req, res) => {
  const id = Number(req.params.id)
  const cur = db.prepare('SELECT * FROM content_items WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '内容不存在' })
  const b = req.body
  db.prepare('UPDATE content_items SET title=?,category=?,author=?,status=?,updated_at=? WHERE id=?')
    .run(b.title ?? cur.title, b.category ?? cur.category, b.author ?? cur.author,
      b.status ?? cur.status, todayStr(), id)
  addOperationLog(req, '编辑内容', `修改内容「${b.title ?? cur.title}」`)
  res.json(mapContent(db.prepare('SELECT * FROM content_items WHERE id=?').get(id)))
})
app.delete('/api/content/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM content_items WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '内容不存在' })
  db.prepare('DELETE FROM content_items WHERE id=?').run(cur.id)
  addOperationLog(req, '删除内容', `删除内容「${cur.title}」`)
  res.json({ ok: true })
})

// ============================================================
// 工作台 / 数据统计（实时聚合）
// ============================================================
function buildDashboard() {
  // 统计卡片：历史趋势用配置，数值实时统计
  const total = db.prepare('SELECT COUNT(*) c FROM projects').get().c
  const active = db.prepare("SELECT COUNT(*) c FROM projects WHERE status='active'").get().c
  const archived = db.prepare("SELECT COUNT(*) c FROM projects WHERE status='archived'").get().c
  const alertCount = db.prepare('SELECT COUNT(*) c FROM alerts').get().c
  const valueMap = { 项目总数: total, 在办项目: active, 已完成: archived, 预警项目: alertCount }

  const statCards = db.prepare('SELECT * FROM stat_card_config ORDER BY sort').all().map((c) => ({
    title: c.title,
    value: valueMap[c.title] ?? 0,
    icon: c.icon,
    trend: parseJson(c.trend, []),
    trendLabel: c.trend_label,
    color: c.color,
  }))

  const monthlyTrends = db.prepare('SELECT month,new_projects AS newProjects,completed_projects AS completedProjects FROM monthly_trends ORDER BY sort').all()

  const categoryRatios = db.prepare(`
    SELECT c.name, c.color, COUNT(p.id) AS value FROM categories c
    LEFT JOIN projects p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.sort`).all().map((r) => ({ name: r.name, value: r.value, color: r.color }))

  const ownerRankings = db.prepare(`
    SELECT u.real_name AS name, COUNT(p.id) AS count FROM projects p
    JOIN users u ON u.id = p.owner_id
    GROUP BY p.owner_id ORDER BY count DESC, u.id`).all().map((r) => ({ name: r.name, count: r.count }))

  return { statCards, monthlyTrends, categoryRatios, ownerRankings }
}

app.get('/api/dashboard', (_req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY done, id').all().map(mapTodo)
  const alerts = db.prepare('SELECT * FROM alerts ORDER BY id').all().map(mapAlert)
  res.json({ ...buildDashboard(), todos, alerts })
})

app.get('/api/statistics', (_req, res) => {
  const dash = buildDashboard()
  const total = dash.statCards.find((c) => c.title === '项目总数').value
  const completed = dash.statCards.find((c) => c.title === '已完成').value
  const enabledUsers = db.prepare('SELECT COUNT(*) c FROM users WHERE enabled=1').get().c
  const disabled = db.prepare("SELECT COUNT(*) c FROM projects WHERE status='disabled'").get().c
  const active = dash.statCards.find((c) => c.title === '在办项目').value
  const avgRow = db.prepare(`
    SELECT AVG(julianday(end_date) - julianday(start_date)) AS d FROM projects
    WHERE start_date != '' AND end_date != ''`).get()
  const projects = db.prepare(`${projectSelect} ORDER BY p.id DESC`).all().map(mapProject)
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort, id').all().map(mapCategory)

  res.json({
    ...dash,
    projects,
    categories,
    summary: {
      total,
      completionRate: total ? Math.round((completed / total) * 100) : 0,
      avgCycleDays: Math.round(avgRow.d || 0),
      activeUsers: enabledUsers,
    },
    statusBars: [
      { label: '启用中', count: active, color: 'bg-brand-600', textColor: 'text-brand-600' },
      { label: '禁用', count: disabled, color: 'bg-amber-500', textColor: 'text-amber-600' },
      { label: '已归档', count: completed, color: 'bg-slate-400', textColor: 'text-slate-500' },
    ],
  })
})

// ---------- 健康检查 ----------
app.get('/api/health', (_req, res) => res.json({ ok: true, time: nowStr() }))

// ---------- 生产模式：托管前端构建产物 dist（单端口全栈） ----------
const distDir = join(__dirname, '..', '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(distDir, 'index.html')))
}

// ---------- 全局错误处理 ----------
app.use((err, _req, res, _next) => {
  console.error('[API ERROR]', err)
  res.status(500).json({ message: err.message || '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log('========================================')
  console.log('  综合管理平台后端服务已启动')
  console.log(`  API 地址:  http://localhost:${PORT}/api`)
  console.log(`  数据库:    ${join(__dirname, '..', 'data', 'sm-admin.db')}`)
  if (existsSync(distDir)) console.log(`  前端页面:  http://localhost:${PORT}/`)
  console.log('========================================')
})
