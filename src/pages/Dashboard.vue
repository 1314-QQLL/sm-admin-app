<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FolderKanban, Activity, CheckCircle2, AlertTriangle,
  Plus, UserPlus, ScrollText, BarChart3,
  AlertOctagon, Check, Calendar,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import TrendChart from '@/components/charts/TrendChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import MiniTrend from '@/components/charts/MiniTrend.vue'
import { api } from '@/api'
import type { StatCard, MonthlyTrend, CategoryRatio, TodoItem, AlertItem } from '@/types'

// 工作台数据（来自数据库实时聚合）
const statCards = ref<StatCard[]>([])
const monthlyTrends = ref<MonthlyTrend[]>([])
const categoryRatios = ref<CategoryRatio[]>([])
const todoItems = ref<TodoItem[]>([])
const alertItems = ref<AlertItem[]>([])

onMounted(async () => {
  const data = await api.getDashboard()
  statCards.value = data.statCards
  monthlyTrends.value = data.monthlyTrends
  categoryRatios.value = data.categoryRatios
  todoItems.value = data.todos
  alertItems.value = data.alerts
})

const router = useRouter()
const appStore = useAppStore()

// 当前日期
const today = new Date()
const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const dateText = computed(() => {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const w = weekdays[today.getDay()]
  return `${y}年${m}月${d}日 星期${w}`
})

// 图标映射
const iconMap: Record<string, any> = {
  FolderKanban, Activity, CheckCircle2, AlertTriangle,
}

// 颜色映射
const colorClassMap: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
}
const miniColorMap: Record<string, string> = {
  brand: '#2563eb',
  accent: '#0d9488',
  green: '#16a34a',
  amber: '#f59e0b',
}

// 待办（未完成优先）
const sortedTodos = computed(() =>
  [...todoItems.value].sort((a, b) => Number(a.done) - Number(b.done))
)
const pendingTodoCount = computed(() => todoItems.value.filter(t => !t.done).length)

const priorityDot: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
}

// 快捷操作
const quickActions = [
  { label: '新建项目', icon: Plus, path: '/projects', toast: '即将跳转：项目管理' },
  { label: '新增用户', icon: UserPlus, path: '/users', toast: '即将跳转：用户管理' },
  { label: '查看日志', icon: ScrollText, path: '/logs', toast: '即将跳转：日志监控' },
  { label: '数据统计', icon: BarChart3, path: '/statistics', toast: '即将跳转：数据统计' },
]

const handleAction = (action: typeof quickActions[number]) => {
  appStore.showToast(action.toast, 'info')
  router.push(action.path)
}

// 预警图标
const alertIconMap = {
  danger: { icon: AlertOctagon, color: 'text-red-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-500' },
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex items-end justify-between animate-fade-in-up">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">工作台</h1>
        <p class="mt-1 text-sm text-slate-500">欢迎回来，这里是今日数据概览</p>
      </div>
      <div class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-card">
        <Calendar class="h-4 w-4 text-brand-600" />
        <span class="text-sm text-slate-600">{{ dateText }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="(card, idx) in statCards"
        :key="card.title"
        class="rounded-xl bg-white p-5 shadow-card animate-fade-in-up"
        :style="{ animationDelay: `${idx * 60}ms` }"
      >
        <div class="flex items-start justify-between">
          <div
            :class="cn('flex h-11 w-11 items-center justify-center rounded-full', colorClassMap[card.color])"
          >
            <component :is="iconMap[card.icon]" class="h-5 w-5" />
          </div>
        </div>
        <div class="mt-4 text-3xl font-bold text-slate-800">{{ card.value }}</div>
        <div class="mt-1 text-sm text-gray-500">{{ card.title }}</div>
        <MiniTrend :data="card.trend" :color="miniColorMap[card.color]" />
        <div class="mt-1 text-xs text-gray-400">{{ card.trendLabel }}</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="grid grid-cols-3 gap-4 animate-fade-in-up" style="animation-delay: 240ms">
      <div class="col-span-2 rounded-xl bg-white p-5 shadow-card">
        <div class="mb-2">
          <h2 class="text-base font-semibold text-slate-800">项目趋势</h2>
          <p class="text-xs text-slate-500">近6月新增与完成趋势</p>
        </div>
        <TrendChart :data="monthlyTrends" />
      </div>
      <div class="col-span-1 rounded-xl bg-white p-5 shadow-card">
        <h2 class="mb-2 text-base font-semibold text-slate-800">项目分类占比</h2>
        <PieChart :data="categoryRatios" />
      </div>
    </div>

    <!-- 待办 + 预警 -->
    <div class="grid grid-cols-2 gap-4 animate-fade-in-up" style="animation-delay: 300ms">
      <!-- 待办 -->
      <div class="rounded-xl bg-white p-5 shadow-card">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800">待办事项</h2>
          <span class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            {{ pendingTodoCount }}
          </span>
        </div>
        <div class="space-y-3">
          <div
            v-for="todo in sortedTodos"
            :key="todo.id"
            class="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
          >
            <span
              :class="cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', priorityDot[todo.priority])"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <Check
                  v-if="todo.done"
                  class="h-3.5 w-3.5 text-green-500"
                />
                <span
                  :class="cn('text-sm', todo.done ? 'text-slate-400 line-through' : 'text-slate-700')"
                >
                  {{ todo.title }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                <span>{{ todo.project }}</span>
                <span>·</span>
                <span>{{ todo.deadline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预警 -->
      <div class="rounded-xl bg-white p-5 shadow-card">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-800">预警提醒</h2>
          <span class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            {{ alertItems.length }}
          </span>
        </div>
        <div class="space-y-3">
          <div
            v-for="alert in alertItems"
            :key="alert.id"
            class="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
          >
            <component
              :is="alertIconMap[alert.severity].icon"
              :class="cn('mt-0.5 h-5 w-5 shrink-0', alertIconMap[alert.severity].color)"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-medium text-slate-700">{{ alert.projectName }}</span>
                <span
                  :class="cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    alert.severity === 'danger'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600'
                  )"
                >
                  {{ alert.days > 0 ? `${alert.days}天` : `${Math.abs(alert.days)}天前` }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-500">{{ alert.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="rounded-xl bg-white p-5 shadow-card animate-fade-in-up" style="animation-delay: 360ms">
      <h2 class="mb-3 text-base font-semibold text-slate-800">快捷操作</h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="action in quickActions"
          :key="action.label"
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
          @click="handleAction(action)"
        >
          <component :is="action.icon" class="h-4 w-4" />
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>
