<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '@/components/charts/echarts'
import type { OwnerRanking } from '@/types'

const props = defineProps<{
  data: OwnerRanking[]
}>()

const option = computed(() => {
  // 倒序使最高值位于顶部
  const sorted = [...props.data].sort((a, b) => a.count - b.count)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: sorted.map((item) => item.name),
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((item) => item.count),
        itemStyle: {
          color: '#2563eb',
          borderRadius: [0, 4, 4, 0],
        },
        barMaxWidth: 22,
      },
    ],
  }
})
</script>

<template>
  <VChart :option="option" autoresize style="height: 320px" />
</template>
