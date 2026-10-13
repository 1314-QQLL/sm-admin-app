// ============================================================
// 数据库初始化种子数据（与前端原型 mockData 保持一致）
// 仅在首次建库 / 执行 npm run seed 时写入
// ============================================================

export const menus = [
  { id: 1, name: '工作台', path: '/', icon: 'LayoutDashboard', parentId: null, sort: 1 },
  { id: 2, name: '项目管理', path: '/projects', icon: 'FolderKanban', parentId: null, sort: 2 },
  { id: 3, name: '用户管理', path: '/users', icon: 'Users', parentId: null, sort: 3 },
  { id: 4, name: '角色权限', path: '/roles', icon: 'ShieldCheck', parentId: null, sort: 4 },
  { id: 5, name: '数据统计', path: '/statistics', icon: 'BarChart3', parentId: null, sort: 5 },
  { id: 6, name: '内容配置', path: '/content', icon: 'Settings2', parentId: null, sort: 6 },
  { id: 7, name: '日志监控', path: '/logs', icon: 'ScrollText', parentId: null, sort: 7 },
  { id: 8, name: '系统设置', path: '/settings', icon: 'Cog', parentId: null, sort: 8 },
]

export const categories = [
  { id: 1, name: '研发项目', sort: 1, enabled: 1, color: '#2563eb', createdAt: '2026-01-15' },
  { id: 2, name: '实施项目', sort: 2, enabled: 1, color: '#0d9488', createdAt: '2026-01-15' },
  { id: 3, name: '运维项目', sort: 3, enabled: 1, color: '#f59e0b', createdAt: '2026-01-15' },
  { id: 4, name: '咨询项目', sort: 4, enabled: 1, color: '#8b5cf6', createdAt: '2026-01-20' },
  { id: 5, name: '其他项目', sort: 5, enabled: 0, color: '#94a3b8', createdAt: '2026-02-01' },
]

export const roles = [
  {
    id: 1, name: '超级管理员', description: '拥有系统全部权限，可管理所有模块和配置', enabled: 1,
    menuPerms: [1, 2, 3, 4, 5, 6, 7, 8],
    opPerms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    dataScope: 'all',
  },
  {
    id: 2, name: '运营管理员', description: '负责项目管理和用户管理，可查看统计和日志', enabled: 1,
    menuPerms: [1, 2, 3, 5, 7],
    opPerms: [1, 2, 3, 4, 5, 6, 7, 8],
    dataScope: 'department',
  },
  {
    id: 3, name: '普通操作员', description: '负责项目日常操作和查看个人待办', enabled: 1,
    menuPerms: [1, 2],
    opPerms: [1, 2, 5],
    dataScope: 'self',
  },
  {
    id: 4, name: '只读访客', description: '仅可查看数据，无操作权限', enabled: 0,
    menuPerms: [1, 5],
    opPerms: [],
    dataScope: 'all',
  },
]

export const users = [
  { id: 1, username: 'admin', realName: '系统管理员', roleId: 1, department: '信息中心', email: 'admin@system.com', phone: '13800000001', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-09 08:30:12', createdAt: '2026-01-01' },
  { id: 2, username: 'ops_mgr1', realName: '张伟', roleId: 2, department: '运营部', email: 'zhangwei@system.com', phone: '13800000002', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-09 09:15:33', createdAt: '2026-01-05' },
  { id: 3, username: 'ops_mgr2', realName: '李娜', roleId: 2, department: '运营部', email: 'lina@system.com', phone: '13800000003', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-08 17:20:45', createdAt: '2026-01-06' },
  { id: 4, username: 'operator1', realName: '王强', roleId: 3, department: '研发部', email: 'wangqiang@system.com', phone: '13800000004', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-09 08:45:21', createdAt: '2026-01-10' },
  { id: 5, username: 'operator2', realName: '赵敏', roleId: 3, department: '研发部', email: 'zhaomin@system.com', phone: '13800000005', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-09 07:50:18', createdAt: '2026-01-12' },
  { id: 6, username: 'operator3', realName: '陈杰', roleId: 3, department: '实施部', email: 'chenjie@system.com', phone: '13800000006', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-08 16:30:09', createdAt: '2026-01-15' },
  { id: 7, username: 'operator4', realName: '刘洋', roleId: 3, department: '实施部', email: 'liuyang@system.com', phone: '13800000007', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-08 14:22:55', createdAt: '2026-01-18' },
  { id: 8, username: 'operator5', realName: '周婷', roleId: 3, department: '运维部', email: 'zhouting@system.com', phone: '13800000008', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-09 09:00:33', createdAt: '2026-01-20' },
  { id: 9, username: 'operator6', realName: '吴昊', roleId: 3, department: '运维部', email: 'wuhao@system.com', phone: '13800000009', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-07 18:15:42', createdAt: '2026-01-22' },
  { id: 10, username: 'operator7', realName: '郑爽', roleId: 3, department: '研发部', email: 'zhengshuang@system.com', phone: '13800000010', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-08 11:30:28', createdAt: '2026-02-01' },
  { id: 11, username: 'operator8', realName: '孙超', roleId: 3, department: '实施部', email: 'sunchao@system.com', phone: '13800000011', enabled: 0, password: 'Abc@123456', lastLogin: '2026-09-28 10:20:15', createdAt: '2026-02-05' },
  { id: 12, username: 'operator9', realName: '何静', roleId: 3, department: '运维部', email: 'hejing@system.com', phone: '13800000012', enabled: 1, password: 'Abc@123456', lastLogin: '2026-10-06 15:45:50', createdAt: '2026-02-10' },
]

export const projects = [
  { id: 1, code: 'PRJ-2026-001', name: '智慧城市数据中台建设', categoryId: 1, ownerId: 4, status: 'active', progress: 75, startDate: '2026-03-01', endDate: '2026-12-31', description: '构建城市级数据中台，整合多源异构数据，支撑智慧城市上层应用' },
  { id: 2, code: 'PRJ-2026-002', name: '政务OA系统升级改造', categoryId: 1, ownerId: 5, status: 'active', progress: 60, startDate: '2026-04-01', endDate: '2026-11-30', description: '对现有政务办公系统进行微服务化改造和功能升级' },
  { id: 3, code: 'PRJ-2026-003', name: '区级数据中心部署', categoryId: 2, ownerId: 6, status: 'active', progress: 90, startDate: '2026-02-15', endDate: '2026-10-15', description: '完成区级数据中心机房建设、设备安装与调试' },
  { id: 4, code: 'PRJ-2026-004', name: '网络安全态势感知平台', categoryId: 1, ownerId: 7, status: 'active', progress: 45, startDate: '2026-05-01', endDate: '2027-01-31', description: '建设网络安全监测预警与态势感知分析平台' },
  { id: 5, code: 'PRJ-2026-005', name: '统一身份认证系统', categoryId: 1, ownerId: 4, status: 'active', progress: 80, startDate: '2026-03-10', endDate: '2026-09-30', description: '建设统一身份认证与单点登录平台，接入各业务系统' },
  { id: 6, code: 'PRJ-2026-006', name: '云基础设施运维', categoryId: 3, ownerId: 8, status: 'active', progress: 55, startDate: '2026-01-01', endDate: '2026-12-31', description: '负责云平台基础设施日常运维与优化' },
  { id: 7, code: 'PRJ-2026-007', name: '移动政务APP开发', categoryId: 1, ownerId: 5, status: 'active', progress: 35, startDate: '2026-06-01', endDate: '2027-02-28', description: '开发移动端政务服务应用，支持在线办事和查询' },
  { id: 8, code: 'PRJ-2026-008', name: '数据中心网络改造', categoryId: 2, ownerId: 6, status: 'active', progress: 70, startDate: '2026-04-15', endDate: '2026-11-15', description: '对数据中心网络架构进行升级改造，提升带宽和可靠性' },
  { id: 9, code: 'PRJ-2026-009', name: '大数据分析平台二期', categoryId: 1, ownerId: 7, status: 'disabled', progress: 30, startDate: '2026-07-01', endDate: '2027-03-31', description: '大数据分析平台二期功能扩展与性能优化' },
  { id: 10, code: 'PRJ-2026-010', name: '灾备系统建设', categoryId: 2, ownerId: 8, status: 'active', progress: 50, startDate: '2026-05-15', endDate: '2027-01-15', description: '建设同城灾备中心，实现关键业务数据级灾备' },
  { id: 11, code: 'PRJ-2025-098', name: '旧版门户网站重构', categoryId: 1, ownerId: 4, status: 'archived', progress: 100, startDate: '2025-06-01', endDate: '2026-03-31', description: '对旧版门户网站进行全面技术栈重构和UI改版' },
  { id: 12, code: 'PRJ-2025-095', name: '机房环控系统升级', categoryId: 3, ownerId: 9, status: 'archived', progress: 100, startDate: '2025-08-01', endDate: '2026-02-28', description: '机房环境监控系统的硬件升级与软件优化' },
  { id: 13, code: 'PRJ-2026-011', name: '日志审计系统部署', categoryId: 2, ownerId: 10, status: 'active', progress: 65, startDate: '2026-04-20', endDate: '2026-12-20', description: '部署集中式日志审计系统，满足合规审计要求' },
  { id: 14, code: 'PRJ-2026-012', name: '视频会议系统扩容', categoryId: 3, ownerId: 12, status: 'active', progress: 40, startDate: '2026-06-10', endDate: '2027-01-10', description: '对现有视频会议系统进行扩容和性能优化' },
  { id: 15, code: 'PRJ-2025-090', name: '电子签章系统集成', categoryId: 4, ownerId: 7, status: 'archived', progress: 100, startDate: '2025-05-01', endDate: '2025-12-31', description: '电子签章系统与OA系统的集成对接' },
]

export const loginLogs = [
  { operator: '系统管理员', ip: '192.168.1.100', action: '登录', detail: '从192.168.1.100登录系统', result: 'success', time: '2026-10-09 08:30:12' },
  { operator: '张伟', ip: '192.168.1.101', action: '登录', detail: '从192.168.1.101登录系统', result: 'success', time: '2026-10-09 09:15:33' },
  { operator: '王强', ip: '192.168.1.105', action: '登录', detail: '从192.168.1.105登录系统', result: 'success', time: '2026-10-09 08:45:21' },
  { operator: '赵敏', ip: '192.168.1.106', action: '登录', detail: '从192.168.1.106登录系统', result: 'success', time: '2026-10-09 07:50:18' },
  { operator: '周婷', ip: '192.168.1.110', action: '登录', detail: '从192.168.1.110登录系统', result: 'success', time: '2026-10-09 09:00:33' },
  { operator: '未知用户', ip: '10.0.5.88', action: '登录', detail: '尝试用admin账户登录，密码错误3次', result: 'fail', time: '2026-10-09 03:22:45' },
  { operator: '李娜', ip: '192.168.1.102', action: '登出', detail: '主动退出系统', result: 'success', time: '2026-10-08 17:20:45' },
  { operator: '陈杰', ip: '192.168.1.107', action: '登录', detail: '从192.168.1.107登录系统', result: 'success', time: '2026-10-08 16:30:09' },
  { operator: '刘洋', ip: '192.168.1.108', action: '登录', detail: '从192.168.1.108登录系统', result: 'success', time: '2026-10-08 14:22:55' },
  { operator: '郑爽', ip: '192.168.1.112', action: '登录', detail: '从192.168.1.112登录系统', result: 'success', time: '2026-10-08 11:30:28' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '登录', detail: '从192.168.1.100登录系统', result: 'success', time: '2026-10-08 08:15:00' },
  { operator: '吴昊', ip: '192.168.1.109', action: '登录', detail: '从192.168.1.109登录系统', result: 'success', time: '2026-10-07 18:15:42' },
  { operator: '何静', ip: '192.168.1.113', action: '登录', detail: '从192.168.1.113登录系统', result: 'success', time: '2026-10-06 15:45:50' },
  { operator: '孙超', ip: '192.168.1.111', action: '登录', detail: '账户已停用，登录被拒', result: 'fail', time: '2026-10-05 10:20:15' },
  { operator: '未知用户', ip: '45.32.1.55', action: '登录', detail: '外部IP尝试暴力破解，已自动封禁', result: 'fail', time: '2026-10-04 02:15:33' },
  { operator: '张伟', ip: '192.168.1.101', action: '登录', detail: '从192.168.1.101登录系统', result: 'success', time: '2026-10-04 09:10:00' },
  { operator: '王强', ip: '192.168.1.105', action: '登出', detail: '主动退出系统', result: 'success', time: '2026-10-03 18:30:00' },
  { operator: '赵敏', ip: '192.168.1.106', action: '登录', detail: '从192.168.1.106登录系统', result: 'success', time: '2026-10-03 08:45:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '登录', detail: '从192.168.1.100登录系统', result: 'success', time: '2026-10-02 08:00:00' },
  { operator: '李娜', ip: '192.168.1.102', action: '登录', detail: '从192.168.1.102登录系统', result: 'success', time: '2026-10-01 09:20:00' },
]

export const operationLogs = [
  { operator: '系统管理员', ip: '192.168.1.100', action: '新增项目', detail: '创建项目「智慧城市数据中台建设」(PRJ-2026-001)', result: 'success', time: '2026-10-09 08:35:00' },
  { operator: '张伟', ip: '192.168.1.101', action: '编辑项目', detail: '修改项目「政务OA系统升级改造」进度为60%', result: 'success', time: '2026-10-09 09:20:00' },
  { operator: '王强', ip: '192.168.1.105', action: '状态变更', detail: '将项目「统一身份认证系统」状态从禁用切换为启用', result: 'success', time: '2026-10-09 08:50:00' },
  { operator: '赵敏', ip: '192.168.1.106', action: '新增用户', detail: '创建用户「operator9」(何静)', result: 'success', time: '2026-10-09 07:55:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '权限配置', detail: '修改角色「普通操作员」菜单权限', result: 'success', time: '2026-10-08 17:30:00' },
  { operator: '周婷', ip: '192.168.1.110', action: '编辑项目', detail: '修改项目「云基础设施运维」进度为55%', result: 'success', time: '2026-10-09 09:10:00' },
  { operator: '张伟', ip: '192.168.1.101', action: '删除项目', detail: '删除无效项目草稿', result: 'success', time: '2026-10-08 16:00:00' },
  { operator: '李娜', ip: '192.168.1.102', action: '编辑用户', detail: '修改用户「operator7」部门为研发部', result: 'success', time: '2026-10-08 15:30:00' },
  { operator: '王强', ip: '192.168.1.105', action: '状态变更', detail: '将项目「旧版门户网站重构」归档', result: 'success', time: '2026-10-07 17:00:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '系统设置', detail: '修改系统名称为「综合管理平台」', result: 'success', time: '2026-10-07 10:00:00' },
  { operator: '陈杰', ip: '192.168.1.107', action: '编辑项目', detail: '修改项目「区级数据中心部署」进度为90%', result: 'success', time: '2026-10-06 14:00:00' },
  { operator: '刘洋', ip: '192.168.1.108', action: '新增项目', detail: '创建项目「网络安全态势感知平台」(PRJ-2026-004)', result: 'success', time: '2026-10-05 09:00:00' },
  { operator: '张伟', ip: '192.168.1.101', action: '重置密码', detail: '重置用户「operator8」密码', result: 'success', time: '2026-10-04 11:30:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '停用用户', detail: '停用用户「operator7」(孙超)', result: 'success', time: '2026-10-03 16:00:00' },
  { operator: '赵敏', ip: '192.168.1.106', action: '新增项目', detail: '创建项目「移动政务APP开发」(PRJ-2026-007)', result: 'success', time: '2026-10-02 10:00:00' },
  { operator: '周婷', ip: '192.168.1.110', action: '编辑项目', detail: '修改项目「灾备系统建设」描述信息', result: 'success', time: '2026-10-01 14:00:00' },
  { operator: '王强', ip: '192.168.1.105', action: '新增分类', detail: '新增项目分类「咨询项目」', result: 'success', time: '2026-09-30 09:00:00' },
  { operator: '郑爽', ip: '192.168.1.112', action: '编辑项目', detail: '修改项目「日志审计系统部署」进度为65%', result: 'success', time: '2026-09-29 15:00:00' },
  { operator: '李娜', ip: '192.168.1.102', action: '导出数据', detail: '导出项目数据(15条)', result: 'success', time: '2026-09-28 10:30:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '数据备份', detail: '手动触发系统数据备份', result: 'success', time: '2026-09-27 18:00:00' },
  { operator: '何静', ip: '192.168.1.113', action: '编辑项目', detail: '修改项目「视频会议系统扩容」进度为40%', result: 'success', time: '2026-09-26 14:00:00' },
  { operator: '张伟', ip: '192.168.1.101', action: '新增用户', detail: '创建用户「operator8」(郑爽)', result: 'success', time: '2026-09-25 10:00:00' },
  { operator: '吴昊', ip: '192.168.1.109', action: '归档项目', detail: '归档项目「机房环控系统升级」', result: 'success', time: '2026-09-24 16:00:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '安全设置', detail: '修改密码复杂度策略为高强度', result: 'success', time: '2026-09-23 11:00:00' },
  { operator: '刘洋', ip: '192.168.1.108', action: '编辑项目', detail: '修改项目「大数据分析平台二期」状态为禁用', result: 'success', time: '2026-09-22 14:00:00' },
  { operator: '赵敏', ip: '192.168.1.106', action: '新增项目', detail: '创建项目「移动政务APP开发」', result: 'success', time: '2026-09-21 09:00:00' },
  { operator: '陈杰', ip: '192.168.1.107', action: '编辑项目', detail: '修改项目「数据中心网络改造」进度为70%', result: 'success', time: '2026-09-20 15:00:00' },
  { operator: '周婷', ip: '192.168.1.110', action: '编辑分类', detail: '修改分类「研发项目」排序', result: 'success', time: '2026-09-19 10:00:00' },
  { operator: '系统管理员', ip: '192.168.1.100', action: '角色管理', detail: '修改角色「只读访客」为停用', result: 'success', time: '2026-09-18 08:00:00' },
  { operator: '王强', ip: '192.168.1.105', action: '新增项目', detail: '创建项目「统一身份认证系统」(PRJ-2026-005)', result: 'success', time: '2026-09-17 14:00:00' },
]

export const exceptionLogs = [
  { operator: '未知', ip: '45.32.1.55', action: '暴力破解', detail: '检测到外部IP对admin账户进行暴力破解，已自动封禁IP', result: 'fail', time: '2026-10-09 03:22:45' },
  { operator: '系统', ip: '127.0.0.1', action: '服务异常', detail: '数据库连接池达到最大连接数(100)，自动扩容', result: 'fail', time: '2026-10-08 14:35:00' },
  { operator: '孙超', ip: '192.168.1.111', action: '权限拒绝', detail: '用户尝试访问已停用的账户，登录被拒绝', result: 'fail', time: '2026-10-05 10:20:15' },
  { operator: '系统', ip: '127.0.0.1', action: '定时任务失败', detail: '日志归档定时任务执行失败，磁盘空间不足', result: 'fail', time: '2026-10-04 02:00:00' },
  { operator: '系统', ip: '127.0.0.1', action: '接口超时', detail: '第三方数据同步接口超时，已重试3次', result: 'fail', time: '2026-10-03 15:30:00' },
  { operator: '未知', ip: '10.0.5.88', action: 'SQL注入', detail: '检测到SQL注入攻击尝试，请求已被WAF拦截', result: 'fail', time: '2026-10-02 22:10:33' },
  { operator: '系统', ip: '127.0.0.1', action: '内存溢出', detail: '数据导出服务内存溢出，已自动重启', result: 'fail', time: '2026-10-01 16:45:00' },
  { operator: '系统', ip: '127.0.0.1', action: '证书过期', detail: 'SSL证书将在7天后过期，请及时更换', result: 'fail', time: '2026-09-30 08:00:00' },
]

export const todos = [
  { id: 1, title: '审核「智慧城市数据中台建设」项目变更申请', priority: 'high', deadline: '2026-10-10', project: '智慧城市数据中台建设', done: 0 },
  { id: 2, title: '确认「区级数据中心部署」验收材料', priority: 'high', deadline: '2026-10-12', project: '区级数据中心部署', done: 0 },
  { id: 3, title: '处理「统一身份认证系统」联调反馈', priority: 'medium', deadline: '2026-10-15', project: '统一身份认证系统', done: 0 },
  { id: 4, title: '提交「网络安全态势感知平台」月度报告', priority: 'medium', deadline: '2026-10-20', project: '网络安全态势感知平台', done: 0 },
  { id: 5, title: '跟进「灾备系统建设」设备采购进度', priority: 'low', deadline: '2026-10-25', project: '灾备系统建设', done: 0 },
  { id: 6, title: '整理「日志审计系统部署」测试文档', priority: 'low', deadline: '2026-10-28', project: '日志审计系统部署', done: 1 },
]

export const alerts = [
  { id: 1, projectName: '区级数据中心部署', type: 'expiring', message: '项目即将到期，距截止日仅剩6天', severity: 'warning', days: 6 },
  { id: 2, projectName: '统一身份认证系统', type: 'overdue', message: '项目已超期，距截止日已过9天', severity: 'danger', days: -9 },
  { id: 3, projectName: '大数据分析平台二期', type: 'stalled', message: '项目进度停滞超过30天', severity: 'warning', days: 30 },
  { id: 4, projectName: '移动政务APP开发', type: 'expiring', message: '项目进度落后，完成率仅35%', severity: 'warning', days: 0 },
]

export const systemParams = [
  { id: 1, key: 'project_code_prefix', value: 'PRJ', description: '项目编号前缀', updatedAt: '2026-01-15' },
  { id: 2, key: 'default_page_size', value: '10', description: '列表默认每页条数', updatedAt: '2026-01-15' },
  { id: 3, key: 'session_timeout', value: '30', description: '会话超时时间(分钟)', updatedAt: '2026-02-01' },
  { id: 4, key: 'max_login_attempts', value: '5', description: '最大登录尝试次数', updatedAt: '2026-02-10' },
  { id: 5, key: 'backup_frequency', value: 'daily', description: '数据备份频率', updatedAt: '2026-03-01' },
  { id: 6, key: 'notification_email', value: 'notify@system.com', description: '系统通知邮箱', updatedAt: '2026-03-15' },
]

export const contentItems = [
  { id: 1, title: '项目管理规范手册', category: '管理制度', author: '系统管理员', status: 'published', updatedAt: '2026-09-15' },
  { id: 2, title: '用户操作指南', category: '操作文档', author: '张伟', status: 'published', updatedAt: '2026-09-20' },
  { id: 3, title: '系统应急预案', category: '管理制度', author: '系统管理员', status: 'published', updatedAt: '2026-08-30' },
  { id: 4, title: '数据备份操作手册', category: '操作文档', author: '周婷', status: 'draft', updatedAt: '2026-09-25' },
  { id: 5, title: '角色权限配置说明', category: '操作文档', author: '李娜', status: 'published', updatedAt: '2026-09-10' },
  { id: 6, title: '日志审计操作规程', category: '管理制度', author: '郑爽', status: 'draft', updatedAt: '2026-09-28' },
]

export const monthlyTrends = [
  { month: '5月', newProjects: 2, completedProjects: 1, sort: 1 },
  { month: '6月', newProjects: 3, completedProjects: 1, sort: 2 },
  { month: '7月', newProjects: 1, completedProjects: 0, sort: 3 },
  { month: '8月', newProjects: 2, completedProjects: 1, sort: 4 },
  { month: '9月', newProjects: 3, completedProjects: 2, sort: 5 },
  { month: '10月', newProjects: 4, completedProjects: 3, sort: 6 },
]

// 工作台统计卡片的迷你趋势（历史快照，用于折线图；实时数值由数据库统计得出）
export const statCardConfigs = [
  { title: '项目总数', icon: 'FolderKanban', trend: [8, 10, 12, 13, 14, 15], trendLabel: '较上月+1', color: 'brand', sort: 1 },
  { title: '在办项目', icon: 'Activity', trend: [5, 6, 7, 8, 9, 10], trendLabel: '较上月+1', color: 'accent', sort: 2 },
  { title: '已完成', icon: 'CheckCircle2', trend: [1, 1, 2, 2, 3, 3], trendLabel: '较上月+0', color: 'green', sort: 3 },
  { title: '预警项目', icon: 'AlertTriangle', trend: [2, 3, 3, 4, 4, 4], trendLabel: '较上月+0', color: 'amber', sort: 4 },
]

// 权限树（菜单 -> 操作点）
export const permissionTree = [
  { id: 1, label: '工作台', children: [{ id: 101, label: '查看数据看板' }] },
  {
    id: 2, label: '项目管理', children: [
      { id: 201, label: '查看项目列表' },
      { id: 202, label: '新增项目' },
      { id: 203, label: '编辑项目' },
      { id: 204, label: '删除项目' },
      { id: 205, label: '切换项目状态' },
    ],
  },
  {
    id: 3, label: '用户管理', children: [
      { id: 301, label: '查看用户列表' },
      { id: 302, label: '新增用户' },
      { id: 303, label: '编辑用户' },
      { id: 304, label: '启停用户' },
      { id: 305, label: '重置密码' },
    ],
  },
  {
    id: 4, label: '角色权限', children: [
      { id: 401, label: '查看角色列表' },
      { id: 402, label: '新增角色' },
      { id: 403, label: '编辑角色权限' },
    ],
  },
  { id: 5, label: '数据统计', children: [{ id: 501, label: '查看统计图表' }] },
  {
    id: 6, label: '内容配置', children: [
      { id: 601, label: '管理分类' },
      { id: 602, label: '管理参数' },
      { id: 603, label: '维护内容' },
    ],
  },
  {
    id: 7, label: '日志监控', children: [
      { id: 701, label: '查看登录日志' },
      { id: 702, label: '查看操作日志' },
      { id: 703, label: '查看异常日志' },
      { id: 704, label: '导出日志' },
    ],
  },
  {
    id: 8, label: '系统设置', children: [
      { id: 801, label: '修改基本信息' },
      { id: 802, label: '配置安全策略' },
      { id: 803, label: '配置通知' },
      { id: 804, label: '数据备份' },
    ],
  },
]
