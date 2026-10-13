<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Download, Search, RotateCcw, Eye } from 'lucide-vue-next'
import { api } from '@/api'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import Modal from '@/components/Modal.vue'
import Pagination from '@/components/Pagination.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { LogEntry, LogType } from '@/types'

const appStore = useAppStore()

const tabs: { key: LogType; label: string }[] = [
  { key: 'login', label: '登录日志' },
  { key: 'operation', label: '操作日志' },
  { key: 'exception', label: '异常日志' },
]
const activeTab = ref<LogType>('login')

// 三类日志（来自数据库）
const logsMap = reactive<Record<LogType, LogEntry[]>>({ login: [], operation: [], exception: [] })
onMounted(async () => {
  const [login, operation, exception] = await Promise.all([
    api.getLogs('login'), api.getLogs('operation'), api.getLogs('exception'),
  ])
  logsMap.login = login
  logsMap.operation = operation
  logsMap.exception = exception
})

const search = reactive({
  operator: '',
  ip: '',
  keyword: '',
  dateFrom: '',
  dateTo: '',
})
const page = ref(1)
const pageSize = 8

const switchTab = (key: LogType) => {
  activeTab.value = key
  page.value = 1
}

const filteredData = computed(() => {
  return logsMap[activeTab.value].filter(item => {
    if (search.operator && !item.operator.toLowerCase().includes(search.operator.toLowerCase())) return false
    if (search.ip && !item.ip.includes(search.ip)) return false
    if (search.keyword) {
      const kw = search.keyword.toLowerCase()
      if (!item.action.toLowerCase().includes(kw) && !item.detail.toLowerCase().includes(kw)) return false
    }
    if (search.dateFrom && item.time.slice(0, 10) < search.dateFrom) return false
    if (search.dateTo && item.time.slice(0, 10) > search.dateTo) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

const handleSearch = () => { page.value = 1 }
const handleReset = () => {
  search.operator = ''
  search.ip = ''
  search.keyword = ''
  search.dateFrom = ''
  search.dateTo = ''
  page.value = 1
}
const handleExport = () => appStore.showToast('日志导出成功', 'success')

const detailVisible = ref(false)
const currentLog = ref<LogEntry | null>(null)
const showDetail = (log: LogEntry) => {
  currentLog.value = log
  detailVisible.value = true
}
</script>

<template>
  <div class="space-y-4 animate-fade-in">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">日志监控</h1>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
        @click="handleExport"
      >
        <Download class="h-4 w-4" />
        导出日志
      </button>
    </div>

    <!-- Tab navigation -->
    <div class="flex items-center gap-1 rounded-t-lg border-b border-slate-200 bg-white px-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition"
        :class="cn(
          activeTab === tab.key
            ? 'border-brand-600 text-brand-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        )"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
        <span
          :class="cn(
            'inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-xs',
            activeTab === tab.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
          )"
        >
          {{ logsMap[tab.key].length }}
        </span>
      </button>
    </div>

    <!-- Search bar -->
    <div class="rounded-lg bg-white p-4 shadow-card">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          v-model="search.operator"
          type="text"
          placeholder="操作人或用户名"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div class="flex items-center gap-1">
          <input
            v-model="search.dateFrom"
            type="date"
            class="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <span class="text-slate-400">—</span>
          <input
            v-model="search.dateTo"
            type="date"
            class="w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <input
          v-model="search.ip"
          type="text"
          placeholder="IP地址"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <input
          v-model="search.keyword"
          type="text"
          placeholder="关键词搜索"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            @click="handleSearch"
          >
            <Search class="h-4 w-4" />
            搜索
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            @click="handleReset"
          >
            <RotateCcw class="h-4 w-4" />
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg bg-white shadow-card">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">时间</th>
            <th class="px-4 py-3 font-medium">操作人</th>
            <th class="px-4 py-3 font-medium">IP地址</th>
            <th class="px-4 py-3 font-medium">操作类型</th>
            <th class="px-4 py-3 font-medium">详情</th>
            <th class="px-4 py-3 font-medium">结果</th>
            <th class="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="log in pagedData" :key="log.id" class="table-row-hover transition-colors">
            <td class="whitespace-nowrap px-4 py-3 text-slate-600">{{ log.time }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ log.operator }}</td>
            <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ log.ip }}</td>
            <td class="px-4 py-3 text-slate-600">{{ log.action }}</td>
            <td class="max-w-[260px] px-4 py-3 text-slate-600">
              <span class="block truncate" :title="log.detail">{{ log.detail }}</span>
            </td>
            <td class="px-4 py-3">
              <StatusBadge :status="log.result" type="log" />
            </td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-brand-600 transition hover:text-brand-700"
                @click="showDetail(log)"
              >
                <Eye class="h-4 w-4" />
                查看详情
              </button>
            </td>
          </tr>
          <tr v-if="pagedData.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-slate-400">暂无匹配的日志记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="rounded-lg bg-white p-3 shadow-card">
      <Pagination :total="filteredData.length" v-model:page="page" :page-size="pageSize" />
    </div>

    <!-- Detail modal -->
    <Modal v-model="detailVisible" title="日志详情" width="max-w-xl">
      <dl v-if="currentLog" class="space-y-3 text-sm">
        <div class="flex">
          <dt class="w-28 text-slate-500">日志ID</dt>
          <dd class="flex-1 text-slate-800">{{ currentLog.id }}</dd>
        </div>
        <div class="flex">
          <dt class="w-28 text-slate-500">日志类型</dt>
          <dd class="flex-1 text-slate-800">{{ tabs.find(t => t.key === currentLog.type)?.label }}</dd>
        </div>
        <div class="flex">
          <dt class="w-28 text-slate-500">时间</dt>
          <dd class="flex-1 text-slate-800">{{ currentLog.time }}</dd>
        </div>
        <div class="flex">
          <dt class="w-28 text-slate-500">操作人</dt>
          <dd class="flex-1 text-slate-800">{{ currentLog.operator }}</dd>
        </div>
        <div class="flex">
          <dt class="w-28 text-slate-500">IP地址</dt>
          <dd class="flex-1 font-mono text-slate-800">{{ currentLog.ip }}</dd>
        </div>
        <div class="flex">
          <dt class="w-28 text-slate-500">操作类型</dt>
          <dd class="flex-1 text-slate-800">{{ currentLog.action }}</dd>
        </div>
        <div class="flex">
          <dt class="w-28 text-slate-500">结果</dt>
          <dd class="flex-1"><StatusBadge :status="currentLog.result" type="log" /></dd>
        </div>
        <div class="flex">
          <dt class="w-28 shrink-0 text-slate-500">详情</dt>
          <dd class="flex-1 leading-relaxed text-slate-800">{{ currentLog.detail }}</dd>
        </div>
      </dl>
      <template #footer>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          @click="detailVisible = false"
        >
          关闭
        </button>
      </template>
    </Modal>
  </div>
</template>
