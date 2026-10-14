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
import { db, isSeeded, initDb } from './db.js'

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
// 布尔值：pg 用 true/false，sqlite 用 1/0
const boolVal = (v) => (db.isPg ? !!v : (v ? 1 : 0))
async function nextId(table) { const r = await db.prepare(`SELECT COALESCE(MAX(id),0)+1 AS n FROM ${table}`).get(); return r.n }
const parseJson = (s, fallback) => { try { return JSON.parse(s) ?? fallback } catch { return fallback } }
const operatorOf = (req) => {
  // HTTP 头只允许 Latin-1，前端用 encodeURIComponent 传递中文操作人
  const raw = req.get('x-operator')
  if (raw) { try { return decodeURIComponent(raw) } catch { return raw } }
  return '系统管理员'
}
const ipOf = (req) => req.get('x-forwarded-for') || req.ip?.replace('::ffff:', '') || req.socket.remoteAddress || '127.0.0.1'

// 写操作日志（业务操作自动留痕，可在"日志监控-操作日志"查看）
const addOperationLog = async (req, action, detail, result = 'success') => {
  await db.prepare('INSERT INTO logs (type,operator,ip,action,detail,result,time) VALUES (?,?,?,?,?,?,?)')
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
app.get('/api/menus', async (_req, res) => {
  res.json((await db.prepare('SELECT * FROM menus ORDER BY sort').all()).map(mapMenu))
})

// ============================================================
// 权限树
// ============================================================
app.get('/api/permissions/tree', async (_req, res) => {
  const parents = await db.prepare('SELECT * FROM permission_nodes WHERE parent_id IS NULL ORDER BY sort').all()
  const childStmt = db.prepare('SELECT * FROM permission_nodes WHERE parent_id = ? ORDER BY sort')
  res.json(await Promise.all(parents.map(async (p) => ({
    id: p.id,
    label: p.label,
    children: (await childStmt.all(p.id)).map((c) => ({ id: c.id, label: c.label, parent: p.label })),
  }))))
})

// ============================================================
// 分类
// ============================================================
app.get('/api/categories', async (_req, res) => {
  res.json((await db.prepare('SELECT * FROM categories ORDER BY sort, id').all()).map(mapCategory))
})
app.post('/api/categories', async (req, res) => {
  const { name, sort = 0, enabled = true, color = '#94a3b8' } = req.body
  if (!name) return res.status(400).json({ message: '分类名称不能为空' })
  const id = await nextId('categories')
  await db.prepare('INSERT INTO categories (id,name,sort,enabled,color,created_at) VALUES (?,?,?,?,?,?)')
    .run(id, name, sort, boolVal(enabled), color, todayStr())
  await addOperationLog(req, '新增分类', `新增项目分类「${name}」`)
  res.status(201).json(mapCategory(await db.prepare('SELECT * FROM categories WHERE id=?').get(id)))
})
app.put('/api/categories/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM categories WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '分类不存在' })
  const { name, sort, enabled, color } = req.body
  await db.prepare('UPDATE categories SET name=?,sort=?,enabled=?,color=? WHERE id=?')
    .run(name ?? cur.name, sort ?? cur.sort, enabled === undefined ? cur.enabled : boolVal(enabled), color ?? cur.color, id)
  await addOperationLog(req, '编辑分类', `修改分类「${name ?? cur.name}」`)
  res.json(mapCategory(await db.prepare('SELECT * FROM categories WHERE id=?').get(id)))
})
app.delete('/api/categories/:id', async (req, res) => {
  const cur = await db.prepare('SELECT * FROM categories WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '分类不存在' })
  await db.prepare('DELETE FROM categories WHERE id=?').run(Number(req.params.id))
  await addOperationLog(req, '删除分类', `删除分类「${cur.name}」`)
  res.json({ ok: true })
})

// ============================================================
// 角色
// ============================================================
app.get('/api/roles', async (_req, res) => {
  const rows = await db.prepare(`
    SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) AS user_count
    FROM roles r ORDER BY r.id`).all()
  res.json(rows.map(mapRole))
})
app.post('/api/roles', async (req, res) => {
  const { name, description = '' } = req.body
  if (!name) return res.status(400).json({ message: '角色名称不能为空' })
  const id = await nextId('roles')
  await db.prepare('INSERT INTO roles (id,name,description,enabled,menu_perms,op_perms,data_scope,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, name, description, boolVal(true), '[]', '[]', 'self', todayStr())
  await addOperationLog(req, '新增角色', `创建角色「${name}」`)
  res.status(201).json(mapRole(await db.prepare(`
    SELECT r.*, 0 AS user_count FROM roles r WHERE r.id=?`).get(id)))
})
app.put('/api/roles/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM roles WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '角色不存在' })
  const { name, description, enabled, permissions } = req.body
  const menuPerms = permissions?.menus !== undefined ? JSON.stringify(permissions.menus) : cur.menu_perms
  const opPerms = permissions?.operations !== undefined ? JSON.stringify(permissions.operations) : cur.op_perms
  const dataScope = permissions?.dataScope ?? cur.data_scope
  await db.prepare('UPDATE roles SET name=?,description=?,enabled=?,menu_perms=?,op_perms=?,data_scope=? WHERE id=?')
    .run(name ?? cur.name, description ?? cur.description, enabled === undefined ? cur.enabled : boolVal(enabled),
      menuPerms, opPerms, dataScope, id)
  await addOperationLog(req, '权限配置', `修改角色「${name ?? cur.name}」权限配置`)
  const row = await db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM users u WHERE u.role_id=r.id) AS user_count FROM roles r WHERE r.id=?`).get(id)
  res.json(mapRole(row))
})
app.patch('/api/roles/:id/enabled', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM roles WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '角色不存在' })
  const enabled = boolVal(req.body.enabled)
  await db.prepare('UPDATE roles SET enabled=? WHERE id=?').run(enabled, id)
  await addOperationLog(req, enabled ? '启用角色' : '停用角色', `${enabled ? '启用' : '停用'}角色「${cur.name}」`)
  res.json({ ok: true, enabled: !!enabled })
})
app.delete('/api/roles/:id', async (req, res) => {
  const cur = await db.prepare('SELECT * FROM roles WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '角色不存在' })
  const used = (await db.prepare('SELECT COUNT(*) AS c FROM users WHERE role_id=?').get(cur.id)).c
  if (used > 0) return res.status(400).json({ message: `该角色下仍有 ${used} 个用户，无法删除` })
  await db.prepare('DELETE FROM roles WHERE id=?').run(cur.id)
  await addOperationLog(req, '删除角色', `删除角色「${cur.name}」`)
  res.json({ ok: true })
})

// ============================================================
// 用户
// ============================================================
app.get('/api/users', async (_req, res) => {
  res.json((await db.prepare(`${userSelect} ORDER BY u.id`).all()).map(mapUser))
})
app.post('/api/users', async (req, res) => {
  const b = req.body
  if (!b.username || !b.realName) return res.status(400).json({ message: '用户名和姓名不能为空' })
  if (await db.prepare('SELECT id FROM users WHERE username=?').get(b.username)) {
    return res.status(409).json({ message: `用户名「${b.username}」已存在` })
  }
  const id = await nextId('users')
  await db.prepare(`INSERT INTO users (id,username,real_name,role_id,department,email,phone,enabled,password,last_login,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.username, b.realName, Number(b.roleId) || null, b.department ?? '', b.email ?? '', b.phone ?? '',
      boolVal(true), b.password || 'Abc@123456', '-', todayStr())
  await addOperationLog(req, '新增用户', `创建用户「${b.username}」(${b.realName})`)
  res.status(201).json(mapUser(await db.prepare(`${userSelect} WHERE u.id=?`).get(id)))
})
app.put('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  const b = req.body
  await db.prepare(`UPDATE users SET username=?,real_name=?,role_id=?,department=?,email=?,phone=? WHERE id=?`)
    .run(b.username ?? cur.username, b.realName ?? cur.real_name,
      b.roleId !== undefined ? Number(b.roleId) : cur.role_id,
      b.department ?? cur.department, b.email ?? cur.email, b.phone ?? cur.phone, id)
  await addOperationLog(req, '编辑用户', `修改用户「${b.realName ?? cur.real_name}」信息`)
  res.json(mapUser(await db.prepare(`${userSelect} WHERE u.id=?`).get(id)))
})
app.patch('/api/users/:id/enabled', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  const enabled = boolVal(req.body.enabled)
  await db.prepare('UPDATE users SET enabled=? WHERE id=?').run(enabled, id)
  await addOperationLog(req, enabled ? '启用用户' : '停用用户', `${enabled ? '启用' : '停用'}用户「${cur.real_name}」`)
  res.json({ ok: true, enabled: !!enabled })
})
app.post('/api/users/:id/reset-password', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  await db.prepare('UPDATE users SET password=? WHERE id=?').run('Abc@123456', id)
  await addOperationLog(req, '重置密码', `重置用户「${cur.real_name}」密码为默认密码`)
  res.json({ ok: true, defaultPassword: 'Abc@123456' })
})
app.delete('/api/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM users WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '用户不存在' })
  if (id === 1) return res.status(400).json({ message: '超级管理员账户不可删除' })
  await db.prepare('DELETE FROM users WHERE id=?').run(id)
  await addOperationLog(req, '删除用户', `删除用户「${cur.real_name}」`)
  res.json({ ok: true })
})

// ============================================================
// 项目
// ============================================================
app.get('/api/projects', async (_req, res) => {
  res.json((await db.prepare(`${projectSelect} ORDER BY p.id DESC`).all()).map(mapProject))
})
app.post('/api/projects', async (req, res) => {
  const b = req.body
  if (!b.name || !b.code) return res.status(400).json({ message: '项目编号和名称不能为空' })
  const id = await nextId('projects')
  await db.prepare(`INSERT INTO projects (id,code,name,category_id,owner_id,status,progress,start_date,end_date,description,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, b.code, b.name, Number(b.categoryId) || null, Number(b.ownerId) || null,
      b.status || 'active', Number(b.progress) || 0, b.startDate || '', b.endDate || '', b.description || '', todayStr())
  await addOperationLog(req, '新增项目', `创建项目「${b.name}」(${b.code})`)
  res.status(201).json(mapProject(await db.prepare(`${projectSelect} WHERE p.id=?`).get(id)))
})
app.put('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '项目不存在' })
  const b = req.body
  await db.prepare(`UPDATE projects SET code=?,name=?,category_id=?,owner_id=?,progress=?,start_date=?,end_date=?,description=? WHERE id=?`)
    .run(b.code ?? cur.code, b.name ?? cur.name,
      b.categoryId !== undefined ? Number(b.categoryId) : cur.category_id,
      b.ownerId !== undefined ? Number(b.ownerId) : cur.owner_id,
      b.progress !== undefined ? Number(b.progress) : cur.progress,
      b.startDate ?? cur.start_date, b.endDate ?? cur.end_date, b.description ?? cur.description, id)
  await addOperationLog(req, '编辑项目', `修改项目「${b.name ?? cur.name}」信息`)
  res.json(mapProject(await db.prepare(`${projectSelect} WHERE p.id=?`).get(id)))
})
app.patch('/api/projects/:id/status', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '项目不存在' })
  const { status } = req.body
  if (!['active', 'disabled', 'archived'].includes(status)) return res.status(400).json({ message: '非法状态' })
  await db.prepare('UPDATE projects SET status=? WHERE id=?').run(status, id)
  const label = { active: '启用', disabled: '禁用', archived: '归档' }[status]
  await addOperationLog(req, '状态变更', `将项目「${cur.name}」状态变更为${label}`)
  res.json({ ok: true, status })
})
app.delete('/api/projects/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM projects WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '项目不存在' })
  await db.prepare('DELETE FROM projects WHERE id=?').run(id)
  await addOperationLog(req, '删除项目', `删除项目「${cur.name}」(${cur.code})`)
  res.json({ ok: true })
})

// ============================================================
// 日志
// ============================================================
app.get('/api/logs', async (req, res) => {
  const { type } = req.query
  const rows = type
    ? await db.prepare('SELECT * FROM logs WHERE type=? ORDER BY time DESC, id DESC').all(String(type))
    : await db.prepare('SELECT * FROM logs ORDER BY time DESC, id DESC').all()
  res.json(rows.map(mapLog))
})
app.post('/api/logs', async (req, res) => {
  const b = req.body
  const sql = 'INSERT INTO logs (type,operator,ip,action,detail,result,time) VALUES (?,?,?,?,?,?,?)'
  const args = [b.type || 'operation', b.operator || operatorOf(req), b.ip || ipOf(req),
    b.action || '', b.detail || '', b.result || 'success', b.time || nowStr()]
  if (db.isPg) {
    const row = await db.prepare(`${sql} RETURNING id`).get(...args)
    res.status(201).json({ id: row.id })
  } else {
    const r = await db.prepare(sql).run(...args)
    res.status(201).json({ id: Number(r.lastInsertRowid) })
  }
})

// ============================================================
// 待办 / 预警
// ============================================================
app.get('/api/todos', async (_req, res) => {
  res.json((await db.prepare('SELECT * FROM todos ORDER BY done, id').all()).map(mapTodo))
})
app.patch('/api/todos/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM todos WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '待办不存在' })
  const done = boolVal(req.body.done)
  await db.prepare('UPDATE todos SET done=? WHERE id=?').run(done, id)
  res.json({ ok: true, done: !!done })
})
app.get('/api/alerts', async (_req, res) => {
  res.json((await db.prepare('SELECT * FROM alerts ORDER BY id').all()).map(mapAlert))
})

// ============================================================
// 系统参数
// ============================================================
app.get('/api/params', async (_req, res) => {
  res.json((await db.prepare('SELECT * FROM system_params ORDER BY id').all()).map(mapParam))
})
app.post('/api/params', async (req, res) => {
  const { key, value, description = '' } = req.body
  if (!key || value === undefined) return res.status(400).json({ message: '参数键和值不能为空' })
  const id = await nextId('system_params')
  await db.prepare('INSERT INTO system_params (id,key,value,description,updated_at) VALUES (?,?,?,?,?)')
    .run(id, key, String(value), description, todayStr())
  await addOperationLog(req, '系统设置', `新增系统参数「${key}」`)
  res.status(201).json(mapParam(await db.prepare('SELECT * FROM system_params WHERE id=?').get(id)))
})
app.put('/api/params/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM system_params WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '参数不存在' })
  const { key, value, description } = req.body
  await db.prepare('UPDATE system_params SET key=?,value=?,description=?,updated_at=? WHERE id=?')
    .run(key ?? cur.key, value !== undefined ? String(value) : cur.value, description ?? cur.description, todayStr(), id)
  await addOperationLog(req, '系统设置', `修改系统参数「${key ?? cur.key}」`)
  res.json(mapParam(await db.prepare('SELECT * FROM system_params WHERE id=?').get(id)))
})
app.delete('/api/params/:id', async (req, res) => {
  const cur = await db.prepare('SELECT * FROM system_params WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '参数不存在' })
  await db.prepare('DELETE FROM system_params WHERE id=?').run(cur.id)
  await addOperationLog(req, '系统设置', `删除系统参数「${cur.key}」`)
  res.json({ ok: true })
})

// ============================================================
// 内容
// ============================================================
app.get('/api/content', async (_req, res) => {
  res.json((await db.prepare('SELECT * FROM content_items ORDER BY id DESC').all()).map(mapContent))
})
app.post('/api/content', async (req, res) => {
  const b = req.body
  if (!b.title) return res.status(400).json({ message: '内容标题不能为空' })
  const id = await nextId('content_items')
  await db.prepare('INSERT INTO content_items (id,title,category,author,status,updated_at) VALUES (?,?,?,?,?,?)')
    .run(id, b.title, b.category ?? '管理制度', b.author ?? '系统管理员', b.status || 'draft', todayStr())
  await addOperationLog(req, '新增内容', `新增内容「${b.title}」`)
  res.status(201).json(mapContent(await db.prepare('SELECT * FROM content_items WHERE id=?').get(id)))
})
app.put('/api/content/:id', async (req, res) => {
  const id = Number(req.params.id)
  const cur = await db.prepare('SELECT * FROM content_items WHERE id=?').get(id)
  if (!cur) return res.status(404).json({ message: '内容不存在' })
  const b = req.body
  await db.prepare('UPDATE content_items SET title=?,category=?,author=?,status=?,updated_at=? WHERE id=?')
    .run(b.title ?? cur.title, b.category ?? cur.category, b.author ?? cur.author,
      b.status ?? cur.status, todayStr(), id)
  await addOperationLog(req, '编辑内容', `修改内容「${b.title ?? cur.title}」`)
  res.json(mapContent(await db.prepare('SELECT * FROM content_items WHERE id=?').get(id)))
})
app.delete('/api/content/:id', async (req, res) => {
  const cur = await db.prepare('SELECT * FROM content_items WHERE id=?').get(Number(req.params.id))
  if (!cur) return res.status(404).json({ message: '内容不存在' })
  await db.prepare('DELETE FROM content_items WHERE id=?').run(cur.id)
  await addOperationLog(req, '删除内容', `删除内容「${cur.title}」`)
  res.json({ ok: true })
})

// ============================================================
// 工作台 / 数据统计（实时聚合）
// ============================================================
async function buildDashboard() {
  // 统计卡片：历史趋势用配置，数值实时统计（pg 的 COUNT 返回字符串，统一 Number 化）
  const cnt = async (sql) => Number((await db.prepare(sql).get()).c)
  const total = await cnt('SELECT COUNT(*) c FROM projects')
  const active = await cnt("SELECT COUNT(*) c FROM projects WHERE status='active'")
  const archived = await cnt("SELECT COUNT(*) c FROM projects WHERE status='archived'")
  const alertCount = await cnt('SELECT COUNT(*) c FROM alerts')
  const valueMap = { 项目总数: total, 在办项目: active, 已完成: archived, 预警项目: alertCount }

  const statCards = (await db.prepare('SELECT * FROM stat_card_config ORDER BY sort').all()).map((c) => ({
    title: c.title,
    value: valueMap[c.title] ?? 0,
    icon: c.icon,
    trend: parseJson(c.trend, []),
    trendLabel: c.trend_label,
    color: c.color,
  }))

  const monthlyTrends = await db.prepare('SELECT month,new_projects AS newProjects,completed_projects AS completedProjects FROM monthly_trends ORDER BY sort').all()

  const categoryRatios = (await db.prepare(`
    SELECT c.name, c.color, COUNT(p.id) AS value FROM categories c
    LEFT JOIN projects p ON p.category_id = c.id
    GROUP BY c.id ORDER BY c.sort`).all()).map((r) => ({ name: r.name, value: Number(r.value), color: r.color }))

  const ownerRankings = (await db.prepare(`
    SELECT u.real_name AS name, COUNT(p.id) AS count FROM projects p
    JOIN users u ON u.id = p.owner_id
    GROUP BY p.owner_id, u.real_name, u.id ORDER BY count DESC, u.id`).all()).map((r) => ({ name: r.name, count: Number(r.count) }))

  return { statCards, monthlyTrends, categoryRatios, ownerRankings }
}

app.get('/api/dashboard', async (_req, res) => {
  const todos = (await db.prepare('SELECT * FROM todos ORDER BY done, id').all()).map(mapTodo)
  const alerts = (await db.prepare('SELECT * FROM alerts ORDER BY id').all()).map(mapAlert)
  res.json({ ...await buildDashboard(), todos, alerts })
})

app.get('/api/statistics', async (_req, res) => {
  const dash = await buildDashboard()
  const total = dash.statCards.find((c) => c.title === '项目总数').value
  const completed = dash.statCards.find((c) => c.title === '已完成').value
  const enabledUsers = Number((await db.prepare(`SELECT COUNT(*) c FROM users WHERE enabled=${db.isPg ? 'TRUE' : '1'}`).get()).c)
  const disabled = Number((await db.prepare("SELECT COUNT(*) c FROM projects WHERE status='disabled'").get()).c)
  const active = dash.statCards.find((c) => c.title === '在办项目').value
  // 平均周期：sqlite 用 julianday，pg 用日期相减
  const avgSql = db.isPg
    ? `SELECT AVG(end_date::date - start_date::date) AS d FROM projects WHERE start_date != '' AND end_date != ''`
    : `SELECT AVG(julianday(end_date) - julianday(start_date)) AS d FROM projects WHERE start_date != '' AND end_date != ''`
  const avgRow = await db.prepare(avgSql).get()
  const projects = (await db.prepare(`${projectSelect} ORDER BY p.id DESC`).all()).map(mapProject)
  const categories = (await db.prepare('SELECT * FROM categories ORDER BY sort, id').all()).map(mapCategory)

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

// 启动时确保表结构 + 自动种子
try {
  if (db.isPg) {
    await initDb()
    if (!(await isSeeded())) {
      console.log('[pg] 数据库为空，自动初始化种子数据...')
      const { execSync } = await import('node:child_process')
      execSync('node src/seed.js', { cwd: join(dirname(fileURLToPath(import.meta.url)), '..'), stdio: 'inherit' })
    }
  } else if (!isSeeded()) {
    console.log('[sqlite] 数据库为空，自动初始化种子数据...')
    const { execSync } = await import('node:child_process')
    execSync('node src/seed.js', { cwd: join(dirname(fileURLToPath(import.meta.url)), '..'), stdio: 'inherit' })
  }
} catch (e) {
  console.warn('[db] 启动初始化跳过:', e.message)
}

app.listen(PORT, () => {
  console.log('========================================')
  console.log('  综合管理平台后端服务已启动')
  console.log(`  API 地址:  http://localhost:${PORT}/api`)
  console.log(`  数据库:    ${join(__dirname, '..', 'data', 'sm-admin.db')}`)
  if (existsSync(distDir)) console.log(`  前端页面:  http://localhost:${PORT}/`)
  console.log('========================================')
})
