import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Role, MenuItem } from '@/types'
import { api, setOperator } from '@/api'

export const useAppStore = defineStore('app', () => {
  // 当前登录用户ID（默认超管）
  const currentUserId = ref(1)

  // 通知数量
  const notificationCount = ref(4)

  // Toast消息列表
  const toasts = ref<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([])

  // 来自数据库的基础数据
  const users = ref<User[]>([])
  const roles = ref<Role[]>([])
  const menus = ref<MenuItem[]>([])
  const loading = ref(true)

  // 当前用户
  const currentUser = computed<User | undefined>(() =>
    users.value.find(u => u.id === currentUserId.value) || users.value[0])

  // 当前角色
  const currentRole = computed<Role | undefined>(() =>
    roles.value.find(r => r.id === currentUser.value?.roleId) || roles.value[0])

  // 应用启动时从后端加载基础数据
  const init = async () => {
    try {
      const [userList, roleList, menuList] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getMenus(),
      ])
      users.value = userList
      roles.value = roleList
      menus.value = menuList
      if (currentUser.value) setOperator(currentUser.value.realName)
    } catch {
      // 后端不可用时仍挂载界面，由 axios 拦截器统一提示
    } finally {
      loading.value = false
    }
  }

  // 切换用户（多角色演示）
  const switchUser = (userId: number) => {
    currentUserId.value = userId
    if (currentUser.value) setOperator(currentUser.value.realName)
  }

  // 添加Toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, message, type })
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 3000)
  }

  // 移除Toast
  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    currentUserId,
    notificationCount,
    toasts,
    users,
    roles,
    menus,
    loading,
    currentUser,
    currentRole,
    init,
    switchUser,
    showToast,
    removeToast,
  }
})
