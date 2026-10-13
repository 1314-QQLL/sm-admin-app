<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '@/components/charts/echarts'
import type { MonthlyTrend } from '@/types'

const props = defineProps<{
  data: MonthlyTrend[]
}>()

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
  },
  legend: {
    data: ['新增项目', '完成项目'],
    top: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 40,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: props.data.map((item) => item.month),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '新增项目',
      type: 'bar',
      data: props.data.map((item) => item.newProjects),
      itemStyle: { color: '#2563eb' },
      barMaxWidth: 24,
    },
    {
      name: '完成项目',
      type: 'bar',
      data: props.data.map((item) => item.completedProjects),
      itemStyle: { color: '#0d9488' },
      barMaxWidth: 24,
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize style="height: 360px" />
</template>
