// ============================================================
// 种子数据写入脚本
//   node src/seed.js          仅在库为空时初始化
//   node src/seed.js --force  清空后重新写入（演示数据还原）
// ============================================================
import { db, isSeeded } from './db.js'
import * as data from './seed-data.js'

const force = process.argv.includes('--force')

if (isSeeded() && !force) {
  console.log('数据库已存在数据，跳过初始化。如需重置请执行: npm run seed')
  process.exit(0)
}

const today = () => new Date().toISOString().slice(0, 10)

db.exec('BEGIN')
try {
  if (force) {
    for (const t of [
      'permission_nodes', 'stat_card_config', 'monthly_trends', 'content_items',
      'system_params', 'alerts', 'todos', 'logs', 'projects', 'users',
      'roles', 'categories', 'menus',
    ]) {
      db.exec(`DELETE FROM ${t}`)
    }
    db.exec("DELETE FROM sqlite_sequence WHERE name='logs'")
  }

  const insMenu = db.prepare('INSERT INTO menus (id,name,path,icon,parent_id,sort) VALUES (?,?,?,?,?,?)')
  for (const m of data.menus) insMenu.run(m.id, m.name, m.path, m.icon, m.parentId, m.sort)

  const insCat = db.prepare('INSERT INTO categories (id,name,sort,enabled,color,created_at) VALUES (?,?,?,?,?,?)')
  for (const c of data.categories) insCat.run(c.id, c.name, c.sort, c.enabled, c.color, c.createdAt)

  const insRole = db.prepare('INSERT INTO roles (id,name,description,enabled,menu_perms,op_perms,data_scope,created_at) VALUES (?,?,?,?,?,?,?,?)')
  for (const r of data.roles) {
    insRole.run(r.id, r.name, r.description, r.enabled,
      JSON.stringify(r.menuPerms), JSON.stringify(r.opPerms), r.dataScope, today())
  }

  const insUser = db.prepare('INSERT INTO users (id,username,real_name,role_id,department,email,phone,enabled,password,last_login,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
  for (const u of data.users) {
    insUser.run(u.id, u.username, u.realName, u.roleId, u.department, u.email, u.phone,
      u.enabled, u.password, u.lastLogin, u.createdAt)
  }

  const insProj = db.prepare('INSERT INTO projects (id,code,name,category_id,owner_id,status,progress,start_date,end_date,description,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
  for (const p of data.projects) {
    insProj.run(p.id, p.code, p.name, p.categoryId, p.ownerId, p.status, p.progress,
      p.startDate, p.endDate, p.description, today())
  }

  const insLog = db.prepare('INSERT INTO logs (type,operator,ip,action,detail,result,time) VALUES (?,?,?,?,?,?,?)')
  for (const l of data.loginLogs) insLog.run('login', l.operator, l.ip, l.action, l.detail, l.result, l.time)
  for (const l of data.operationLogs) insLog.run('operation', l.operator, l.ip, l.action, l.detail, l.result, l.time)
  for (const l of data.exceptionLogs) insLog.run('exception', l.operator, l.ip, l.action, l.detail, l.result, l.time)

  const insTodo = db.prepare('INSERT INTO todos (id,title,priority,deadline,project,done) VALUES (?,?,?,?,?,?)')
  for (const t of data.todos) insTodo.run(t.id, t.title, t.priority, t.deadline, t.project, t.done)

  const insAlert = db.prepare('INSERT INTO alerts (id,project_name,type,message,severity,days) VALUES (?,?,?,?,?,?)')
  for (const a of data.alerts) insAlert.run(a.id, a.projectName, a.type, a.message, a.severity, a.days)

  const insParam = db.prepare('INSERT INTO system_params (id,key,value,description,updated_at) VALUES (?,?,?,?,?)')
  for (const p of data.systemParams) insParam.run(p.id, p.key, p.value, p.description, p.updatedAt)

  const insContent = db.prepare('INSERT INTO content_items (id,title,category,author,status,updated_at) VALUES (?,?,?,?,?,?)')
  for (const c of data.contentItems) insContent.run(c.id, c.title, c.category, c.author, c.status, c.updatedAt)

  const insTrend = db.prepare('INSERT INTO monthly_trends (id,month,new_projects,completed_projects,sort) VALUES (?,?,?,?,?)')
  data.monthlyTrends.forEach((t, i) => insTrend.run(i + 1, t.month, t.newProjects, t.completedProjects, t.sort))

  const insCard = db.prepare('INSERT INTO stat_card_config (id,title,icon,trend,trend_label,color,sort) VALUES (?,?,?,?,?,?,?)')
  data.statCardConfigs.forEach((c, i) => insCard.run(i + 1, c.title, c.icon, JSON.stringify(c.trend), c.trendLabel, c.color, c.sort))

  const insNode = db.prepare('INSERT INTO permission_nodes (id,parent_id,label,sort) VALUES (?,?,?,?)')
  let nodeSort = 0
  for (const node of data.permissionTree) {
    insNode.run(node.id, null, node.label, ++nodeSort)
    for (const child of node.children) insNode.run(child.id, node.id, child.label, ++nodeSort)
  }

  db.exec('COMMIT')
  console.log('种子数据写入完成：')
  console.log(`  菜单 ${data.menus.length} | 分类 ${data.categories.length} | 角色 ${data.roles.length} | 用户 ${data.users.length}`)
  console.log(`  项目 ${data.projects.length} | 日志 ${data.loginLogs.length + data.operationLogs.length + data.exceptionLogs.length}`)
  console.log(`  待办 ${data.todos.length} | 预警 ${data.alerts.length} | 参数 ${data.systemParams.length} | 内容 ${data.contentItems.length}`)
} catch (e) {
  db.exec('ROLLBACK')
  console.error('种子数据写入失败:', e)
  process.exit(1)
}
