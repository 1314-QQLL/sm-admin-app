<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Settings as SettingsIcon, Shield, Bell, Database, Image as ImageIcon,
  Save, Loader2,
} from 'lucide-vue-next'
import { api } from '@/api'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import type { SystemParam } from '@/types'

const appStore = useAppStore()

const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'
const btnPrimary = 'inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700'

const tabs = [
  { key: 'basic', label: '基本信息', icon: SettingsIcon },
  { key: 'security', label: '安全策略', icon: Shield },
  { key: 'notify', label: '通知配置', icon: Bell },
  { key: 'backup', label: '数据备份', icon: Database },
]
const activeTab = ref('basic')

// 系统参数（来自数据库）
const paramList = ref<SystemParam[]>([])
const getParam = (key: string) => paramList.value.find(p => p.key === key)?.value || ''

// 存在则更新，不存在则新增
const saveParamValue = async (key: string, value: string | number, description: string) => {
  const existing = paramList.value.find(p => p.key === key)
  if (existing) await api.updateParam(existing.id, { value: String(value) })
  else await api.createParam({ key, value: String(value), description })
  paramList.value = await api.getParams()
}

const basicForm = reactive({
  name: '综合管理平台',
  subtitle: '企业级综合业务管理平台',
  description: '面向政企用户的综合业务管理平台，涵盖项目管理、用户管理、数据统计等核心模块。',
})

const securityForm = reactive({
  minLen: 8,
  complexity: 'medium',
  sessionTimeout: Number(getParam('session_timeout')) || 30,
  maxFailures: Number(getParam('max_login_attempts')) || 5,
  ipWhitelist: '192.168.1.0/24\n10.0.0.0/8',
  enableCaptcha: true,
})

const notifyToggles = [
  { key: 'email' as const, label: '邮件通知' },
  { key: 'sms' as const, label: '短信通知' },
  { key: 'inApp' as const, label: '站内消息' },
  { key: 'alert' as const, label: '预警推送' },
]
const notifyForm = reactive({
  email: true,
  sms: false,
  inApp: true,
  alert: true,
  smtpServer: 'smtp.system.com',
  senderEmail: getParam('notification_email') || 'notify@system.com',
  smsApi: 'https://sms-api.system.com/send',
  template: 'default',
})

const backupForm = reactive({ autoBackup: true, retentionDays: 30 })
const backingUp = ref(false)

const backupInfo = [
  { label: '最近备份时间', value: '2026-10-09 02:00:00' },
  { label: '备份频率', value: '每日' },
  { label: '备份文件大小', value: '256MB' },
  { label: '存储位置', value: '/backups/daily/' },
]
const backupHistory = [
  { date: '2026-10-09 02:00:00', size: '256MB', type: '自动' },
  { date: '2026-10-08 02:00:00', size: '254MB', type: '自动' },
  { date: '2026-10-07 02:00:00', size: '252MB', type: '自动' },
  { date: '2026-10-06 14:30:00', size: '251MB', type: '手动' },
  { date: '2026-10-06 02:00:00', size: '250MB', type: '自动' },
]

const toggleClass = (on: boolean) => cn(
  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
  on ? 'bg-brand-600' : 'bg-slate-300'
)
const knobClass = (on: boolean) => cn(
  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
  on ? 'translate-x-6' : 'translate-x-1'
)

const saveBasic = async () => {
  await saveParamValue('system_name', basicForm.name, '系统名称')
  await saveParamValue('system_subtitle', basicForm.subtitle, '系统副标题')
  appStore.showToast('基本信息保存成功')
}
const saveSecurity = async () => {
  await saveParamValue('session_timeout', securityForm.sessionTimeout, '会话超时时间(分钟)')
  await saveParamValue('max_login_attempts', securityForm.maxFailures, '最大登录尝试次数')
  appStore.showToast('安全策略保存成功')
}
const saveNotify = async () => {
  await saveParamValue('notification_email', notifyForm.senderEmail, '系统通知邮箱')
  appStore.showToast('通知配置保存成功')
}
const saveBackup = async () => {
  await saveParamValue('backup_retention_days', backupForm.retentionDays, '备份保留天数')
  await saveParamValue('backup_auto', backupForm.autoBackup ? 'true' : 'false', '是否自动备份')
  appStore.showToast('备份设置保存成功')
}
const handleLogoUpload = () => appStore.showToast('Logo上传功能演示', 'info')

const handleBackup = () => {
  if (backingUp.value) return
  backingUp.value = true
  setTimeout(() => {
    backingUp.value = false
    appStore.showToast('数据备份成功')
  }, 2000)
}

// 启动时用数据库参数回填表单
onMounted(async () => {
  paramList.value = await api.getParams()
  securityForm.sessionTimeout = Number(getParam('session_timeout')) || 30
  securityForm.maxFailures = Number(getParam('max_login_attempts')) || 5
  notifyForm.senderEmail = getParam('notification_email') || 'notify@system.com'
  if (getParam('system_name')) basicForm.name = getParam('system_name')
  if (getParam('system_subtitle')) basicForm.subtitle = getParam('system_subtitle')
  if (getParam('backup_retention_days')) backupForm.retentionDays = Number(getParam('backup_retention_days'))
  if (getParam('backup_auto')) backupForm.autoBackup = getParam('backup_auto') === 'true'
})
</script>

<template>
  <div class="space-y-4 animate-fade-in">
    <h1 class="text-xl font-semibold text-slate-800">系统设置</h1>
    <div class="flex gap-4">
      <!-- Left tab sidebar -->
      <aside class="w-48 shrink-0 rounded-lg bg-white p-2 shadow-card">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="flex w-full items-center gap-2 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition"
          :class="cn(
            activeTab === tab.key
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-transparent text-slate-600 hover:bg-slate-50'
          )"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
        </button>
      </aside>

      <!-- Right content area -->
      <div class="min-h-[480px] flex-1 rounded-lg bg-white p-6 shadow-card">
        <!-- Tab 1: Basic info -->
        <div v-if="activeTab === 'basic'" class="max-w-xl space-y-4">
          <h2 class="text-base font-semibold text-slate-800">基本信息</h2>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">系统名称</label>
            <input v-model="basicForm.name" type="text" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">系统副标题</label>
            <input v-model="basicForm.subtitle" type="text" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">Logo上传</label>
            <button
              type="button"
              class="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-brand-400 hover:text-brand-500"
              @click="handleLogoUpload"
            >
              <ImageIcon class="h-8 w-8" />
              <span class="text-xs">点击上传Logo</span>
            </button>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">系统描述</label>
            <textarea v-model="basicForm.description" rows="4" :class="cn(inputClass, 'resize-none')"></textarea>
          </div>
          <button type="button" :class="btnPrimary" @click="saveBasic"><Save class="h-4 w-4" /> 保存</button>
        </div>

        <!-- Tab 2: Security -->
        <div v-else-if="activeTab === 'security'" class="max-w-2xl space-y-4">
          <h2 class="text-base font-semibold text-slate-800">安全策略</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">密码最小长度</label>
              <input v-model.number="securityForm.minLen" type="number" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">密码复杂度</label>
              <select v-model="securityForm.complexity" :class="inputClass">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">登录失效时间(分钟)</label>
              <input v-model.number="securityForm.sessionTimeout" type="number" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">最大登录失败次数</label>
              <input v-model.number="securityForm.maxFailures" type="number" :class="inputClass" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">IP白名单(每行一个IP)</label>
            <textarea v-model="securityForm.ipWhitelist" rows="4" :class="cn(inputClass, 'resize-none font-mono text-xs')"></textarea>
          </div>
          <div class="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
            <span class="text-sm font-medium text-slate-600">是否启用验证码</span>
            <button type="button" :class="toggleClass(securityForm.enableCaptcha)" @click="securityForm.enableCaptcha = !securityForm.enableCaptcha"><span :class="knobClass(securityForm.enableCaptcha)" /></button>
          </div>
          <button type="button" :class="btnPrimary" @click="saveSecurity"><Save class="h-4 w-4" /> 保存</button>
        </div>

        <!-- Tab 3: Notify -->
        <div v-else-if="activeTab === 'notify'" class="max-w-2xl space-y-4">
          <h2 class="text-base font-semibold text-slate-800">通知配置</h2>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="item in notifyToggles" :key="item.key" class="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
              <span class="text-sm font-medium text-slate-600">{{ item.label }}</span>
              <button type="button" :class="toggleClass(notifyForm[item.key])" @click="notifyForm[item.key] = !notifyForm[item.key]"><span :class="knobClass(notifyForm[item.key])" /></button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">邮件服务器地址</label>
              <input v-model="notifyForm.smtpServer" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-600">发件邮箱</label>
              <input v-model="notifyForm.senderEmail" type="text" :class="inputClass" />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">短信接口地址</label>
            <input v-model="notifyForm.smsApi" type="text" :class="inputClass" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-600">通知模板</label>
            <select v-model="notifyForm.template" :class="inputClass">
              <option value="default">默认模板</option>
              <option value="simple">简洁模板</option>
              <option value="detailed">详细模板</option>
            </select>
          </div>
          <button type="button" :class="btnPrimary" @click="saveNotify"><Save class="h-4 w-4" /> 保存</button>
        </div>

        <!-- Tab 4: Backup -->
        <div v-else class="max-w-3xl space-y-5">
          <h2 class="text-base font-semibold text-slate-800">数据备份</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="info in backupInfo" :key="info.label" class="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="text-xs text-slate-500">{{ info.label }}</div>
              <div class="mt-1 text-sm font-semibold text-slate-800">{{ info.value }}</div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4">
            <button
              type="button"
              :disabled="backingUp"
              class="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="handleBackup"
            >
              <Loader2 v-if="backingUp" class="h-4 w-4 animate-spin" />
              <Database v-else class="h-4 w-4" />
              {{ backingUp ? '备份中...' : '立即备份' }}
            </button>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-slate-600">自动备份</span>
              <button type="button" :class="toggleClass(backupForm.autoBackup)" @click="backupForm.autoBackup = !backupForm.autoBackup"><span :class="knobClass(backupForm.autoBackup)" /></button>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-slate-600">备份保留天数</span>
              <input v-model.number="backupForm.retentionDays" type="number" class="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <h3 class="mb-2 text-sm font-semibold text-slate-700">备份历史记录</h3>
            <div class="overflow-hidden rounded-md border border-slate-200">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th class="px-4 py-2 font-medium">备份时间</th>
                    <th class="px-4 py-2 font-medium">文件大小</th>
                    <th class="px-4 py-2 font-medium">类型</th>
                    <th class="px-4 py-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(item, idx) in backupHistory" :key="idx" class="table-row-hover">
                    <td class="px-4 py-2 text-slate-600">{{ item.date }}</td>
                    <td class="px-4 py-2 text-slate-600">{{ item.size }}</td>
                    <td class="px-4 py-2 text-slate-600">{{ item.type }}</td>
                    <td class="px-4 py-2">
                      <span class="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">成功</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <button type="button" :class="btnPrimary" @click="saveBackup"><Save class="h-4 w-4" /> 保存设置</button>
        </div>
      </div>
    </div>
  </div>
</template>
