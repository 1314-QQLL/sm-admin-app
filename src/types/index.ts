// 项目状态类型
export type ProjectStatus = 'active' | 'disabled' | 'archived'

// 用户状态
export type UserStatus = 'active' | 'disabled'

// 日志类型
export type LogType = 'login' | 'operation' | 'exception'

// 日志结果
export type LogResult = 'success' | 'fail'

// 项目实体
export interface Project {
  id: number
  code: string
  name: string
  categoryId: number
  categoryName: string
  ownerId: number
  ownerName: string
  status: ProjectStatus
  progress: number
  startDate: string
  endDate: string
  description: string
}

// 用户实体
export interface User {
  id: number
  username: string
  realName: string
  roleId: number
  roleName: string
  department: string
  email: string
  phone: string
  enabled: boolean
  lastLogin: string
  createdAt: string
}

// 角色实体
export interface Role {
  id: number
  name: string
  description: string
  enabled: boolean
  userCount: number
  permissions: RolePermission
}

// 角色权限
export interface RolePermission {
  menus: number[]
  operations: number[]
  dataScope: 'all' | 'department' | 'self'
}

// 日志实体
export interface LogEntry {
  id: number
  type: LogType
  operator: string
  ip: string
  action: string
  detail: string
  result: LogResult
  time: string
}

// 分类实体
export interface Category {
  id: number
  name: string
  sort: number
  enabled: boolean
  color?: string
  createdAt: string
}

// 系统参数
export interface SystemParam {
  id: number
  key: string
  value: string
  description: string
  updatedAt: string
}

// 内容条目
export interface ContentItem {
  id: number
  title: string
  category: string
  author: string
  status: 'published' | 'draft'
  updatedAt: string
}

// 待办事项
export interface TodoItem {
  id: number
  title: string
  priority: 'high' | 'medium' | 'low'
  deadline: string
  project: string
  done: boolean
}

// 预警项
export interface AlertItem {
  id: number
  projectName: string
  type: 'overdue' | 'expiring' | 'stalled'
  message: string
  severity: 'danger' | 'warning'
  days: number
}

// 菜单项
export interface MenuItem {
  id: number
  name: string
  path: string
  icon: string
  parentId: number | null
}

// 统计卡片数据
export interface StatCard {
  title: string
  value: number
  icon: string
  trend: number[]
  trendLabel: string
  color: string
}

// 月度趋势数据
export interface MonthlyTrend {
  month: string
  newProjects: number
  completedProjects: number
}

// 分类占比
export interface CategoryRatio {
  name: string
  value: number
  color: string
}

// 负责人排行
export interface OwnerRanking {
  name: string
  count: number
}
