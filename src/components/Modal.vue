<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string
}>(), {
  title: '',
  width: 'max-w-lg',
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-40 flex items-center justify-center p-4"
    >
      <div class="absolute inset-0 bg-black/50" @click="close" />
      <div
        :class="cn(
          'relative z-10 w-full animate-scale-in rounded-lg bg-white shadow-xl',
          width
        )"
      >
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
          <button
            type="button"
            class="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            @click="close"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="px-6 py-4">
          <slot />
        </div>
        <div
          v-if="$slots.footer"
          class="flex justify-end gap-2 border-t border-slate-200 px-6 py-3"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
