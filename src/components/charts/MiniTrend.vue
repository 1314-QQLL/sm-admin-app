<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '@/components/charts/echarts'

const props = withDefaults(
  defineProps<{
    data: number[]
    color?: string
  }>(),
  {
    color: '#2563eb',
  },
)

const option = computed(() => ({
  series: [
    {
      type: 'line',
      data: props.data,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        color: props.color,
        width: 2,
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: props.color },
            { offset: 1, color: 'rgba(255, 255, 255, 0)' },
          ],
        },
        opacity: 0.25,
      },
    },
  ],
  xAxis: { type: 'category', show: false, boundaryGap: false },
  yAxis: { type: 'value', show: false },
  tooltip: { show: false },
  legend: { show: false },
  grid: { left: 0, right: 0, top: 0, bottom: 0 },
}))
</script>

<template>
  <VChart :option="option" autoresize style="height: 40px; width: 100%" />
</template>
