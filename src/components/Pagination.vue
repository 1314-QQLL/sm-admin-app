<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  total: number
  page: number
  pageSize: number
}
const props = defineProps<Props>()
const emit = defineEmits<{ 'update:page': [value: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const pages = computed(() => {
  const arr: number[] = []
  for (let i = 1; i <= totalPages.value; i++) arr.push(i)
  return arr
})

const go = (p: number) => {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('update:page', p)
}
</script>

<template>
  <div class="flex items-center justify-between">
    <span class="text-sm text-slate-500">共 {{ total }} 条</span>
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="page <= 1"
        @click="go(page - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        v-for="p in pages"
        :key="p"
        type="button"
        :class="[
          'flex h-8 min-w-[32px] items-center justify-center rounded border px-2 text-sm transition',
          p === page
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-slate-200 text-slate-600 hover:bg-slate-50',
        ]"
        @click="go(p)"
      >
        {{ p }}
      </button>
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="page >= totalPages"
        @click="go(page + 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
