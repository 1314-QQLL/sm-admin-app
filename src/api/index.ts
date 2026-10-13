// ============================================================
// 后端 API 请求层（axios）
// 所有页面通过此模块读写 SQLite 数据库，不再使用本地模拟数据
// ============================================================
import axios from 'axios'
import type {
  Project, User, Role, LogEntry, Category, SystemParam, ContentItem,
  TodoItem, AlertItem, StatCard, MonthlyTrend, CategoryRatio, OwnerRanking, MenuItem,
} from '@/types'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 当前操作人（由 Pinia store 在初始化时设置）；中文需编码为 Latin-1 安全字符
let operatorName = '系统管理员'
export function setOperator(name: string) {
  operatorName = name || '系统管理员'
  http.defaults.headers.common['x-operator'] = encodeURIComponent(operatorName)
}
http.defaults.headers.common['x-operator'] = encodeURIComponent(operatorName)

// 统一错误提示（由应用注入，避免 api 层依赖 UI）
let onError: (msg: string) => void = (msg) => console.error(msg)
export function setErrorHandler(fn: (msg: string) => void) { onError = fn }

http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络请求失败'
    onError(msg)
    return Promise.reject(error)
  },
)

// ---------- 聚合返回类型 ----------
export interface DashboardData {
  statCards: StatCard[]
  monthlyTrends: MonthlyTrend[]
  categoryRatios: CategoryRatio[]
  ownerRankings: OwnerRanking[]
  todos: TodoItem[]
  alerts: AlertItem[]
}

export interface StatisticsData {
  statCards: StatCard[]
  monthlyTrends: MonthlyTrend[]
  categoryRatios: CategoryRatio[]
  ownerRankings: OwnerRanking[]
  projects: Project[]
  categories: Category[]
  summary: { total: number; completionRate: number; avgCycleDays: number; activeUsers: number }
  statusBars: { label: string; count: number; color: string; textColor: string }[]
}

export interface PermissionNode {
  id: number
  label: string
  children: { id: number; label: string; parent?: string }[]
}

// ---------- 接口定义 ----------
export const api = {
  // 菜单 & 权限树
  getMenus: () => http.get<MenuItem[]>('/menus').then((r) => r.data),
  getPermissionTree: () => http.get<PermissionNode[]>('/permissions/tree').then((r) => r.data),

  // 工作台 / 统计
  getDashboard: () => http.get<DashboardData>('/dashboard').then((r) => r.data),
  getStatistics: () => http.get<StatisticsData>('/statistics').then((r) => r.data),

  // 待办 / 预警
  getTodos: () => http.get<TodoItem[]>('/todos').then((r) => r.data),
  toggleTodo: (id: number, done: boolean) =>
    http.patch(`/todos/${id}`, { done }).then((r) => r.data),
  getAlerts: () => http.get<AlertItem[]>('/alerts').then((r) => r.data),

  // 项目
  getProjects: () => http.get<Project[]>('/projects').then((r) => r.data),
  createProject: (data: Partial<Project>) => http.post<Project>('/projects', data).then((r) => r.data),
  updateProject: (id: number, data: Partial<Project>) =>
    http.put<Project>(`/projects/${id}`, data).then((r) => r.data),
  setProjectStatus: (id: number, status: Project['status']) =>
    http.patch(`/projects/${id}/status`, { status }).then((r) => r.data),
  deleteProject: (id: number) => http.delete(`/projects/${id}`).then((r) => r.data),

  // 用户
  getUsers: () => http.get<User[]>('/users').then((r) => r.data),
  createUser: (data: Partial<User> & { password?: string }) =>
    http.post<User>('/users', data).then((r) => r.data),
  updateUser: (id: number, data: Partial<User>) =>
    http.put<User>(`/users/${id}`, data).then((r) => r.data),
  setUserEnabled: (id: number, enabled: boolean) =>
    http.patch(`/users/${id}/enabled`, { enabled }).then((r) => r.data),
  resetUserPassword: (id: number) =>
    http.post(`/users/${id}/reset-password`).then((r) => r.data),
  deleteUser: (id: number) => http.delete(`/users/${id}`).then((r) => r.data),

  // 角色
  getRoles: () => http.get<Role[]>('/roles').then((r) => r.data),
  createRole: (data: { name: string; description: string }) =>
    http.post<Role>('/roles', data).then((r) => r.data),
  updateRole: (id: number, data: Partial<Role>) =>
    http.put<Role>(`/roles/${id}`).then((r) => r.data),
  setRoleEnabled: (id: number, enabled: boolean) =>
    http.patch(`/roles/${id}/enabled`, { enabled }).then((r) => r.data),
  deleteRole: (id: number) => http.delete(`/roles/${id}`).then((r) => r.data),

  // 日志
  getLogs: (type?: LogEntry['type']) =>
    http.get<LogEntry[]>('/logs', { params: type ? { type } : {} }).then((r) => r.data),

  // 分类
  getCategories: () => http.get<Category[]>('/categories').then((r) => r.data),
  createCategory: (data: Partial<Category>) =>
    http.post<Category>('/categories', data).then((r) => r.data),
  updateCategory: (id: number, data: Partial<Category>) =>
    http.put<Category>(`/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id: number) => http.delete(`/categories/${id}`).then((r) => r.data),

  // 系统参数
  getParams: () => http.get<SystemParam[]>('/params').then((r) => r.data),
  createParam: (data: Partial<SystemParam>) =>
    http.post<SystemParam>('/params', data).then((r) => r.data),
  updateParam: (id: number, data: Partial<SystemParam>) =>
    http.put<SystemParam>(`/params/${id}`, data).then((r) => r.data),
  deleteParam: (id: number) => http.delete(`/params/${id}`).then((r) => r.data),

  // 内容
  getContent: () => http.get<ContentItem[]>('/content').then((r) => r.data),
  createContent: (data: Partial<ContentItem>) =>
    http.post<ContentItem>('/content', data).then((r) => r.data),
  updateContent: (id: number, data: Partial<ContentItem>) =>
    http.put<ContentItem>(`/content/${id}`, data).then((r) => r.data),
  deleteContent: (id: number) => http.delete(`/content/${id}`).then((r) => r.data),
}
