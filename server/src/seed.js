// ============================================================
// 种子数据写入脚本（pg + sqlite 双兼容）
//   node src/seed.js          仅在库为空时初始化
//   node src/seed.js --force  清空后重新写入
// ============================================================
import { db, isSeeded, pool, initDb } from './db.js'
import * as data from './seed-data.js'

const force = process.argv.includes('--force')

// 兼容模式：sqlite 时用 db.exec/prepare，pg 时用 pool.query
const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => `$${++i}`) }

async function q(sql, params) {
  if (db.isPg) {
    const r = await pool.query(toPg(sql), params || [])
    return r.rowCount
  } else {
    // sqlite 降级
    db.prepare(sql).run(...(params || []))
  }
}
async function qGet(sql, params) {
  if (db.isPg) {
    const r = await pool.query(toPg(sql), params || [])
    return r.rows[0] || null
  } else {
    return db.prepare(sql).get(...(params || []))
  }
}
async function qAll(sql, params) {
  if (db.isPg) {
    const r = await pool.query(toPg(sql), params || [])
    return r.rows
  } else {
    return db.prepare(sql).all(...(params || []))
  }
}

async function main() {
  await initDb() // pg 模式确保表已建好
  if (!force && await isSeeded()) {
    console.log('数据库已存在数据，跳过初始化。如需重置请执行: npm run seed -- --force')
    return
  }

  const today = () => new Date().toISOString().slice(0, 10)

  // pg 模式开事务
  if (db.isPg) await pool.query('BEGIN')
  else db.exec('BEGIN')

  try {
    if (force) {
      for (const t of [
        'permission_nodes', 'stat_card_config', 'monthly_trends', 'content_items',
        'system_params', 'alerts', 'todos', 'logs', 'projects', 'users',
        'roles', 'categories', 'menus',
      ]) {
        if (db.isPg) await pool.query(`DELETE FROM ${t}`)
        else db.exec(`DELETE FROM ${t}`)
      }
      if (!db.isPg) db.exec("DELETE FROM sqlite_sequence WHERE name='logs'")
    }

    const batch = async (table, columns, rows) => {
      if (!rows.length) return
      const placeholders = rows.map((_, i) =>
        `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(',')})`
      ).join(',')
      const values = rows.flatMap(r => columns.map(c => r[c]))
      const sql = db.isPg
        ? `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders} ON CONFLICT DO NOTHING`
        : `INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES ${rows.map(() => `(${columns.map(() => '?').join(',')})`).join(',')}`
      if (db.isPg) { await pool.query(sql, values) }
      else {
        const stmt = db.prepare(sql)
        for (const r of rows) stmt.run(...columns.map(c => r[c]))
      }
    }

    await batch('menus', ['id','name','path','icon','parent_id','sort'], data.menus.map(m => ({ id:m.id, name:m.name, path:m.path, icon:m.icon, parent_id:m.parentId, sort:m.sort })))
    await batch('categories', ['id','name','sort','enabled','color','created_at'], data.categories.map(c => ({ id:c.id, name:c.name, sort:c.sort, enabled:db.isPg ? !!c.enabled : (c.enabled?1:0), color:c.color, created_at:c.createdAt })))
    await batch('roles', ['id','name','description','enabled','menu_perms','op_perms','data_scope','created_at'],
      data.roles.map(r => ({ id:r.id, name:r.name, description:r.description, enabled:db.isPg ? !!r.enabled : (r.enabled?1:0), menu_perms:JSON.stringify(r.menuPerms), op_perms:JSON.stringify(r.opPerms), data_scope:r.dataScope, created_at:today() })))
    await batch('users', ['id','username','real_name','role_id','department','email','phone','enabled','password','last_login','created_at'],
      data.users.map(u => ({ id:u.id, username:u.username, real_name:u.realName, role_id:u.roleId, department:u.department, email:u.email, phone:u.phone, enabled:db.isPg ? !!u.enabled : (u.enabled?1:0), password:u.password, last_login:u.lastLogin, created_at:u.createdAt })))
    await batch('projects', ['id','code','name','category_id','owner_id','status','progress','start_date','end_date','description','created_at'],
      data.projects.map(p => ({ id:p.id, code:p.code, name:p.name, category_id:p.categoryId, owner_id:p.ownerId, status:p.status, progress:p.progress, start_date:p.startDate, end_date:p.endDate, description:p.description, created_at:today() })))

    // 日志（无固定 id，pg identity 自增）
    const logsInsert = 'INSERT INTO logs (type,operator,ip,action,detail,result,time) VALUES (?,?,?,?,?,?,?)'
    for (const l of data.loginLogs) await q(logsInsert, ['login', l.operator, l.ip, l.action, l.detail, l.result, l.time])
    for (const l of data.operationLogs) await q(logsInsert, ['operation', l.operator, l.ip, l.action, l.detail, l.result, l.time])
    for (const l of data.exceptionLogs) await q(logsInsert, ['exception', l.operator, l.ip, l.action, l.detail, l.result, l.time])

    await batch('todos', ['id','title','priority','deadline','project','done'], data.todos.map(t => ({ id:t.id, title:t.title, priority:t.priority, deadline:t.deadline, project:t.project, done:db.isPg ? !!t.done : (t.done?1:0) })))
    await batch('alerts', ['id','project_name','type','message','severity','days'], data.alerts.map(a => ({ id:a.id, project_name:a.projectName, type:a.type, message:a.message, severity:a.severity, days:a.days })))
    await batch('system_params', ['id','key','value','description','updated_at'], data.systemParams.map(p => ({ id:p.id, key:p.key, value:p.value, description:p.description, updated_at:p.updatedAt })))
    await batch('content_items', ['id','title','category','author','status','updated_at'], data.contentItems.map(c => ({ id:c.id, title:c.title, category:c.category, author:c.author, status:c.status, updated_at:c.updatedAt })))
    await batch('monthly_trends', ['id','month','new_projects','completed_projects','sort'], data.monthlyTrends.map((t,i) => ({ id:i+1, month:t.month, new_projects:t.newProjects, completed_projects:t.completedProjects, sort:t.sort })))
    await batch('stat_card_config', ['id','title','icon','trend','trend_label','color','sort'], data.statCardConfigs.map((c,i) => ({ id:i+1, title:c.title, icon:c.icon, trend:JSON.stringify(c.trend), trend_label:c.trendLabel, color:c.color, sort:c.sort })))

    // 权限树（带 parent_id）
    const nodeInsert = 'INSERT INTO permission_nodes (id,parent_id,label,sort) VALUES (?,?,?,?)'
    let nodeSort = 0
    for (const node of data.permissionTree) {
      await q(nodeInsert, [node.id, null, node.label, ++nodeSort])
      for (const child of node.children) await q(nodeInsert, [child.id, node.id, child.label, ++nodeSort])
    }

    if (db.isPg) await pool.query('COMMIT')
    else db.exec('COMMIT')
    console.log('✅ 种子数据写入完成：')
    console.log(`  菜单 ${data.menus.length} | 分类 ${data.categories.length} | 角色 ${data.roles.length} | 用户 ${data.users.length}`)
    console.log(`  项目 ${data.projects.length} | 日志 ${data.loginLogs.length + data.operationLogs.length + data.exceptionLogs.length}`)
  } catch (e) {
    if (db.isPg) await pool.query('ROLLBACK')
    else db.exec('ROLLBACK')
    console.error('❌ 种子数据写入失败:', e)
    process.exit(1)
  } finally {
    if (db.isPg) await pool.end()
  }
}
main()
