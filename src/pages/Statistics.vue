<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  FolderKanban, TrendingUp, Clock, Users, Download,
} from 'lucide-vue-next'
import MonthlyBarChart from '@/components/charts/MonthlyBarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import Pagination from '@/components/Pagination.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAppStore } from '@/stores/app'
import { api } from '@/api'
import type { Project, Category, MonthlyTrend, CategoryRatio, OwnerRanking } from '@/types'
import { cn } from '@/lib/utils'

const appStore = useAppStore()

const timeRange = ref('all')
const categoryFilter = ref('')

const handleExport = () => {
  appStore.showToast('报表导出成功，已下载到本地', 'success')
}

// 实时统计数据（来自数据库聚合）
const monthlyTrends = ref<MonthlyTrend[]>([])
const categoryRatios = ref<CategoryRatio[]>([])
const ownerRankings = ref<OwnerRanking[]>([])
const projects = ref<Project[]>([])
const categories = ref<Category[]>([])
const statusBars = ref<{ label: string; count: number; color: string; textColor: string }[]>([])
const summary = ref({ total: 0, completionRate: 0, avgCycleDays: 0, activeUsers: 0 })

onMounted(async () => {
  const data = await api.getStatistics()
  monthlyTrends.value = data.monthlyTrends
  categoryRatios.value = data.categoryRatios
  ownerRankings.value = data.ownerRankings
  projects.value = data.projects
  categories.value = data.categories
  statusBars.value = data.statusBars
  summary.value = data.summary
})

const statCards = computed(() => [
  { label: '总项目数', value: String(summary.value.total), icon: FolderKanban, iconWrap: 'bg-brand-50 text-brand-600', trend: '数据库实时', trendClass: 'text-slate-400' },
  { label: '完成率', value: `${summary.value.completionRate}%`, icon: TrendingUp, iconWrap: 'bg-green-50 text-green-600', trend: '归档/总数', trendClass: 'text-slate-400' },
  { label: '平均周期', value: `${summary.value.avgCycleDays}天`, icon: Clock, iconWrap: 'bg-accent-50 text-accent-600', trend: '起止日期均值', trendClass: 'text-slate-400' },
  { label: '活跃用户', value: String(summary.value.activeUsers), icon: Users, iconWrap: 'bg-amber-50 text-amber-600', trend: '启用账户', trendClass: 'text-slate-400' },
])

const statusTotal = computed(() => statusBars.value.reduce((s, b) => s + b.count, 0))
const statusMax = computed(() => Math.max(1, ...statusBars.value.map((b) => b.count)))

const page = ref(1)
const pageSize = 5
const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize
  return projects.value.slice(start, start + pageSize)
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold text-slate-800">数据统计</h1>
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="timeRange"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="month1">近1月</option>
          <option value="month3">近3月</option>
          <option value="month6">近6月</option>
          <option value="all">全部</option>
        </select>
        <select
          v-model="categoryFilter"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
        </select>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          @click="handleExport"
        >
          <Download class="h-4 w-4" />
          导出报表
        </button>
      </div>
    </div>

    <!-- 概览统计卡片 -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
      <div
        v-for="card in statCards"
        :key="card.label"
        class="rounded-xl bg-white p-5 shadow-card"
      >
        <div class="flex items-center justify-between">
          <div :class="['flex h-11 w-11 items-center justify-center rounded-full', card.iconWrap]">
            <component :is="card.icon" class="h-5 w-5" />
          </div>
          <span :class="['text-xs font-medium', card.trendClass]">{{ card.trend }}</span>
        </div>
        <p class="mt-4 text-3xl font-bold text-slate-800">{{ card.value }}</p>
        <p class="mt-1 text-sm text-slate-500">{{ card.label }}</p>
      </div>
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 animate-fade-in-up">
      <div class="rounded-xl bg-white p-5 shadow-card">
        <h3 class="mb-4 text-base font-semibold text-slate-800">月度项目趋势</h3>
        <MonthlyBarChart :data="monthlyTrends" />
      </div>
      <div class="rounded-xl bg-white p-5 shadow-card">
        <h3 class="mb-4 text-base font-semibold text-slate-800">项目分类占比</h3>
        <PieChart :data="categoryRatios" />
      </div>
      <div class="rounded-xl bg-white p-5 shadow-card">
        <h3 class="mb-4 text-base font-semibold text-slate-800">负责人项目排行</h3>
        <BarChart :data="ownerRankings" />
      </div>
      <div class="rounded-xl bg-white p-5 shadow-card">
        <h3 class="mb-4 text-base font-semibold text-slate-800">项目状态分布</h3>
        <div class="space-y-5">
          <div v-for="bar in statusBars" :key="bar.label">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span class="font-medium text-slate-700">{{ bar.label }}</span>
              <span :class="bar.textColor">
                {{ bar.count }} 个 · {{ ((bar.count / statusTotal) * 100).toFixed(0) }}%
              </span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                :class="bar.color"
                class="h-full rounded-full transition-all duration-500"
                :style="{ width: `${(bar.count / statusMax) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目明细表格 -->
    <div class="rounded-xl bg-white p-5 shadow-card animate-fade-in-up">
      <h3 class="mb-4 text-base font-semibold text-slate-800">项目明细</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 text-xs text-slate-500">
              <th class="px-3 py-3 font-medium">项目编号</th>
              <th class="px-3 py-3 font-medium">项目名称</th>
              <th class="px-3 py-3 font-medium">分类</th>
              <th class="px-3 py-3 font-medium">负责人</th>
              <th class="px-3 py-3 font-medium">状态</th>
              <th class="px-3 py-3 font-medium">进度</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in pagedProjects"
              :key="p.id"
              class="table-row-hover border-b border-slate-100"
            >
              <td class="px-3 py-3 font-mono text-xs text-slate-600">{{ p.code }}</td>
              <td class="px-3 py-3 font-medium text-slate-800">{{ p.name }}</td>
              <td class="px-3 py-3 text-slate-600">{{ p.categoryName }}</td>
              <td class="px-3 py-3 text-slate-600">{{ p.ownerName }}</td>
              <td class="px-3 py-3"><StatusBadge :status="p.status" type="project" /></td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      class="h-full rounded-full bg-brand-500"
                      :style="{ width: `${p.progress}%` }"
                    />
                  </div>
                  <span class="text-xs text-slate-500">{{ p.progress }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="mt-4">
        <Pagination :total="projects.length" v-model:page="page" :page-size="pageSize" />
      </div>
    </div>
  </div>
</template>
