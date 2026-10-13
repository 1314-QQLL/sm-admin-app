import { createRouter, createWebHistory } from 'vue-router'

// 根据部署环境动态设置 base 路径
const base = import.meta.env.PROD && window.location.pathname.includes('/sm-admin')
  ? '/sm-admin/'
  : '/'
import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/pages/Dashboard.vue'
import Projects from '@/pages/Projects.vue'
import Users from '@/pages/Users.vue'
import Roles from '@/pages/Roles.vue'
import Statistics from '@/pages/Statistics.vue'
import Content from '@/pages/Content.vue'
import Logs from '@/pages/Logs.vue'
import Settings from '@/pages/Settings.vue'

// 定义路由配置
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'dashboard', component: Dashboard, meta: { title: '工作台', icon: 'LayoutDashboard' } },
      { path: 'projects', name: 'projects', component: Projects, meta: { title: '项目管理', icon: 'FolderKanban' } },
      { path: 'users', name: 'users', component: Users, meta: { title: '用户管理', icon: 'Users' } },
      { path: 'roles', name: 'roles', component: Roles, meta: { title: '角色权限', icon: 'ShieldCheck' } },
      { path: 'statistics', name: 'statistics', component: Statistics, meta: { title: '数据统计', icon: 'BarChart3' } },
      { path: 'content', name: 'content', component: Content, meta: { title: '内容配置', icon: 'Settings2' } },
      { path: 'logs', name: 'logs', component: Logs, meta: { title: '日志监控', icon: 'ScrollText' } },
      { path: 'settings', name: 'settings', component: Settings, meta: { title: '系统设置', icon: 'Cog' } },
    ],
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(base),
  routes,
})

export default router
