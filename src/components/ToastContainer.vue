<script setup lang="ts">
import { CheckCircle, XCircle, Info, X } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const iconMap: Record<string, { icon: any; color: string }> = {
  success: { icon: CheckCircle, color: 'text-green-500' },
  error: { icon: XCircle, color: 'text-red-500' },
  info: { icon: Info, color: 'text-brand-500' },
}
</script>

<template>
  <div class="fixed right-4 top-4 z-[100] flex flex-col gap-2">
    <div
      v-for="toast in appStore.toasts"
      :key="toast.id"
      class="toast-slide-in flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
    >
      <component
        :is="iconMap[toast.type].icon"
        :class="['h-5 w-5 shrink-0', iconMap[toast.type].color]"
      />
      <span class="text-sm text-slate-700">{{ toast.message }}</span>
      <button
        type="button"
        class="ml-2 text-slate-400 transition hover:text-slate-600"
        @click="appStore.removeToast(toast.id)"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toast-slide-in {
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
