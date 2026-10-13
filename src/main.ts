import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAppStore } from './stores/app'
import { setErrorHandler } from './api'

// 创建Vue应用实例
const app = createApp(App)

// 使用Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 使用路由
app.use(router)

// 启动前先从数据库加载用户/角色/菜单等基础数据
const appStore = useAppStore()
setErrorHandler((msg) => appStore.showToast(msg, 'error'))

async function bootstrap() {
  await appStore.init()
  // 挂载应用
  app.mount('#app')
}
bootstrap()
