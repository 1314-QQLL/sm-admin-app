<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import '@/components/charts/echarts'
import type { CategoryRatio } from '@/types'

const props = defineProps<{
  data: CategoryRatio[]
}>()

const total = computed(() =>
  props.data.reduce((sum, item) => sum + item.value, 0),
)

const option = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: { name: string; value: number; percent: number }) =>
      `${params.name}: ${params.value} (${params.percent}%)`,
  },
  legend: {
    orient: 'horizontal',
    bottom: 0,
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: {
        show: false,
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      data: props.data.map((item) => ({
        name: item.name,
        value: item.value,
        itemStyle: { color: item.color },
      })),
    },
  ],
  graphic: {
    type: 'text',
    left: 'center',
    top: '38%',
    style: {
      text: `总计 ${total.value}`,
      textAlign: 'center',
      fill: '#475569',
      fontSize: 16,
      fontWeight: 'bold',
    },
  },
}))
</script>

<template>
  <VChart :option="option" autoresize style="height: 320px" />
</template>
