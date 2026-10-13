<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  UserPlus, Search, RotateCcw, Edit, ToggleLeft, ToggleRight, Key,
} from 'lucide-vue-next'
import { api } from '@/api'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import Pagination from '@/components/Pagination.vue'
import type { User, Role } from '@/types'

const appStore = useAppStore()

// 共享样式
const inputCls = 'h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
const btnPrimary = 'inline-flex items-center gap-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700'
const btnGhost = 'rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50'

// 用户列表（来自数据库）
const userList = ref<User[]>([])
const roles = ref<Role[]>([])
const loadUsers = async () => { userList.value = await api.getUsers() }
onMounted(async () => {
  roles.value = await api.getRoles()
  await loadUsers()
})

// 搜索条件
const search = reactive({ username: '', roleId: '', status: '' })

const filteredList = computed(() =>
  userList.value.filter(u => {
    if (search.username && !u.username.includes(search.username) && !u.realName.includes(search.username)) return false
    if (search.roleId && u.roleId !== Number(search.roleId)) return false
    if (search.status === 'enabled' && !u.enabled) return false
    if (search.status === 'disabled' && u.enabled) return false
    return true
  }),
)

// 分页
const page = ref(1)
const pageSize = ref(10)
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handleSearch = () => { page.value = 1 }
const handleReset = () => {
  search.username = ''
  search.roleId = ''
  search.status = ''
  page.value = 1
}

// 角色标签颜色
const roleTagClass = (roleName: string) => {
  if (roleName === '超级管理员') return 'bg-brand-50 text-brand-700'
  if (roleName === '运营管理员') return 'bg-accent-50 text-accent-700'
  return 'bg-slate-100 text-slate-600'
}

// 新增/编辑弹窗
const formModal = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: 0, username: '', realName: '', roleId: '', roleName: '',
  department: '', email: '', phone: '', password: '',
})

const openAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: 0, username: '', realName: '', roleId: '', roleName: '',
    department: '', email: '', phone: '', password: '',
  })
  formModal.value = true
}

const openEdit = (user: User) => {
  isEdit.value = true
  Object.assign(form, {
    id: user.id, username: user.username, realName: user.realName,
    roleId: String(user.roleId), roleName: user.roleName,
    department: user.department, email: user.email, phone: user.phone,
    password: '',
  })
  formModal.value = true
}

const handleSave = async () => {
  const payload = {
    username: form.username,
    realName: form.realName,
    roleId: Number(form.roleId),
    department: form.department,
    email: form.email,
    phone: form.phone,
  }
  if (isEdit.value) {
    await api.updateUser(form.id, payload)
    appStore.showToast('用户更新成功', 'success')
  } else {
    await api.createUser({ ...payload, password: form.password })
    appStore.showToast('用户新增成功', 'success')
  }
  formModal.value = false
  await loadUsers()
}

// 重置密码确认
const resetModal = ref(false)
const resetUser = ref<User | null>(null)
const openReset = (user: User) => { resetUser.value = user; resetModal.value = true }
const confirmReset = async () => {
  if (resetUser.value) await api.resetUserPassword(resetUser.value.id)
  appStore.showToast('密码重置成功', 'success')
  resetModal.value = false
}

// 启用/停用确认
const toggleModal = ref(false)
const toggleUser = ref<User | null>(null)
const openToggle = (user: User) => { toggleUser.value = user; toggleModal.value = true }
const confirmToggle = async () => {
  if (toggleUser.value) {
    const next = !toggleUser.value.enabled
    await api.setUserEnabled(toggleUser.value.id, next)
    appStore.showToast(next ? '用户已启用' : '用户已停用', 'success')
  }
  toggleModal.value = false
  await loadUsers()
}
const toggleActionText = computed(() => (toggleUser.value?.enabled ? '停用' : '启用'))
</script>

<template>
  <div class="space-y-4">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">用户管理</h1>
      <button type="button" :class="btnPrimary" @click="openAdd">
        <UserPlus class="h-4 w-4" /> 新增用户
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div class="flex flex-wrap items-center gap-3">
        <input v-model="search.username" type="text" placeholder="用户名 / 姓名" class="h-9 w-48 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" @keyup.enter="handleSearch" />
        <select v-model="search.roleId" class="h-9 w-40 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          <option value="">全部角色</option>
          <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <select v-model="search.status" class="h-9 w-32 rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          <option value="">全部状态</option>
          <option value="enabled">正常</option>
          <option value="disabled">停用</option>
        </select>
        <button type="button" :class="btnPrimary" @click="handleSearch"><Search class="h-4 w-4" /> 搜索</button>
        <button type="button" :class="btnGhost" @click="handleReset"><RotateCcw class="h-4 w-4" /> 重置</button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <th class="px-4 py-3">用户名</th>
            <th class="px-4 py-3">姓名</th>
            <th class="px-4 py-3">角色</th>
            <th class="px-4 py-3">部门</th>
            <th class="px-4 py-3">邮箱</th>
            <th class="px-4 py-3">状态</th>
            <th class="px-4 py-3">最后登录时间</th>
            <th class="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in pagedList" :key="user.id" class="border-b border-slate-100 transition-colors hover:bg-slate-50">
            <td class="px-4 py-3 font-medium text-slate-800">{{ user.username }}</td>
            <td class="px-4 py-3 text-slate-700">{{ user.realName }}</td>
            <td class="px-4 py-3">
              <span :class="cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', roleTagClass(user.roleName))">{{ user.roleName }}</span>
            </td>
            <td class="px-4 py-3 text-slate-700">{{ user.department }}</td>
            <td class="px-4 py-3 text-slate-600">{{ user.email }}</td>
            <td class="px-4 py-3"><StatusBadge :status="user.enabled ? 'active' : 'disabled'" type="user" /></td>
            <td class="px-4 py-3 text-slate-500">{{ user.lastLogin }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-3">
                <button type="button" class="inline-flex items-center gap-1 text-slate-600 transition hover:text-brand-600" @click="openEdit(user)"><Edit class="h-4 w-4" /> 编辑</button>
                <button type="button" :class="cn('inline-flex items-center gap-1 transition', user.enabled ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700')" @click="openToggle(user)">
                  <component :is="user.enabled ? ToggleRight : ToggleLeft" class="h-4 w-4" /> {{ user.enabled ? '停用' : '启用' }}
                </button>
                <button type="button" class="inline-flex items-center gap-1 text-slate-600 transition hover:text-accent-600" @click="openReset(user)"><Key class="h-4 w-4" /> 重置密码</button>
              </div>
            </td>
          </tr>
          <tr v-if="pagedList.length === 0"><td colspan="8" class="px-4 py-10 text-center text-slate-400">暂无用户数据</td></tr>
        </tbody>
      </table>
      <div class="border-t border-slate-200 px-4 py-3">
        <Pagination :total="filteredList.length" :page="page" :page-size="pageSize" @update:page="page = $event" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <Modal v-model="formModal" :title="isEdit ? '编辑用户' : '新增用户'" width="max-w-xl">
      <div class="grid grid-cols-2 gap-4">
        <div><label class="mb-1 block text-sm font-medium text-slate-700">用户名</label><input v-model="form.username" type="text" :class="inputCls" /></div>
        <div><label class="mb-1 block text-sm font-medium text-slate-700">姓名</label><input v-model="form.realName" type="text" :class="inputCls" /></div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">角色</label>
          <select v-model="form.roleId" :class="inputCls">
            <option value="" disabled>请选择角色</option>
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>
        <div><label class="mb-1 block text-sm font-medium text-slate-700">部门</label><input v-model="form.department" type="text" :class="inputCls" /></div>
        <div><label class="mb-1 block text-sm font-medium text-slate-700">邮箱</label><input v-model="form.email" type="text" :class="inputCls" /></div>
        <div><label class="mb-1 block text-sm font-medium text-slate-700">手机号</label><input v-model="form.phone" type="text" :class="inputCls" /></div>
        <div v-if="!isEdit" class="col-span-2"><label class="mb-1 block text-sm font-medium text-slate-700">密码</label><input v-model="form.password" type="password" placeholder="请输入初始密码" :class="inputCls" /></div>
      </div>
      <template #footer>
        <button type="button" :class="btnGhost" @click="formModal = false">取消</button>
        <button type="button" :class="btnPrimary" @click="handleSave">确认</button>
      </template>
    </Modal>

    <!-- 重置密码确认 -->
    <Modal v-model="resetModal" title="重置密码确认" width="max-w-md">
      <div class="text-sm leading-relaxed text-slate-600">
        确认重置该用户的密码？重置后密码将变为默认密码 <span class="font-semibold text-brand-700">Abc@123456</span>
      </div>
      <template #footer>
        <button type="button" :class="btnGhost" @click="resetModal = false">取消</button>
        <button type="button" :class="btnPrimary" @click="confirmReset">确认</button>
      </template>
    </Modal>

    <!-- 启用/停用确认 -->
    <Modal v-model="toggleModal" :title="`${toggleActionText}确认`" width="max-w-md">
      <div class="text-sm text-slate-600">确认{{ toggleActionText }}用户「{{ toggleUser?.realName }}」？</div>
      <template #footer>
        <button type="button" :class="btnGhost" @click="toggleModal = false">取消</button>
        <button type="button" :class="btnPrimary" @click="confirmToggle">确认</button>
      </template>
    </Modal>
  </div>
</template>
