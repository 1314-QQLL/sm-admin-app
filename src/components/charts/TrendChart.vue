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
    boundaryGap: false,
    data: props.data.map((item) => item.month),
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '新增项目',
      type: 'line',
      smooth: true,
      data: props.data.map((item) => item.newProjects),
      itemStyle: { color: '#2563eb' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(37, 99, 235, 0.35)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
          ],
        },
      },
    },
    {
      name: '完成项目',
      type: 'line',
      smooth: true,
      data: props.data.map((item) => item.completedProjects),
      itemStyle: { color: '#0d9488' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(13, 148, 136, 0.35)' },
            { offset: 1, color: 'rgba(13, 148, 136, 0.02)' },
          ],
        },
      },
    },
  ],
}))
</script>

<template>
  <VChart :option="option" autoresize style="height: 320px" />
</template>
