<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: string
  type?: 'project' | 'user' | 'log'
}
const props = withDefaults(defineProps<Props>(), { type: 'project' })

const config = computed(() => {
  const { status, type } = props
  if (type === 'project') {
    switch (status) {
      case 'active': return { label: '启用', color: 'green' }
      case 'disabled': return { label: '禁用', color: 'amber' }
      case 'archived': return { label: '归档', color: 'gray' }
      default: return { label: status, color: 'gray' }
    }
  }
  if (type === 'user') {
    switch (status) {
      case 'active': return { label: '正常', color: 'green' }
      case 'disabled': return { label: '停用', color: 'red' }
      default: return { label: status, color: 'gray' }
    }
  }
  switch (status) {
    case 'success': return { label: '成功', color: 'green' }
    case 'fail': return { label: '失败', color: 'red' }
    default: return { label: status, color: 'gray' }
  }
})

const colorClass = computed(() => {
  const map: Record<string, string> = {
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200',
  }
  return map[config.value.color] || map.gray
})
</script>

<template>
  <span
    :class="['inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', colorClass]"
  >
    {{ config.label }}
  </span>
</template>
