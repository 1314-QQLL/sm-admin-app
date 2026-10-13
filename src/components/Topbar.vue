<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Bell, ChevronDown, UserCog } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'

const route = useRoute()
const appStore = useAppStore()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const pageTitle = computed(() => (route.meta.title as string) || '工作台')

const initials = computed(() => {
  const name = appStore.currentUser?.realName || ''
  return name ? name.slice(-2) : 'U'
})

const roleOptions = [
  { userId: 1, label: '超级管理员' },
  { userId: 2, label: '运营管理员' },
  { userId: 4, label: '普通操作员' },
]

const handleSwitch = (userId: number) => {
  appStore.switchUser(userId)
  dropdownOpen.value = false
  appStore.showToast('角色已切换', 'success')
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <header
    class="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6"
  >
    <!-- Left: title + breadcrumb -->
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold text-slate-800">{{ pageTitle }}</h1>
      <div class="h-4 w-px bg-slate-300" />
      <nav class="hidden items-center gap-1 text-sm text-slate-500 sm:flex">
        <span>首页</span>
        <span class="text-slate-400">/</span>
        <span class="text-slate-700">{{ pageTitle }}</span>
      </nav>
    </div>

    <!-- Center: search -->
    <div class="relative mx-4 hidden max-w-md flex-1 md:block">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="搜索项目、用户、日志..."
        class="w-full rounded-full bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-500"
      />
    </div>

    <!-- Right: notifications + user -->
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
      >
        <Bell class="h-5 w-5" />
        <span
          v-if="appStore.notificationCount > 0"
          class="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white"
        >
          {{ appStore.notificationCount }}
        </span>
      </button>

      <!-- User dropdown -->
      <div ref="dropdownRef" class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg p-1 transition hover:bg-slate-100"
          @click="dropdownOpen = !dropdownOpen"
        >
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {{ initials }}
          </div>
          <div class="hidden text-left sm:block">
            <div class="text-sm font-medium text-slate-800">{{ appStore.currentUser?.realName }}</div>
            <div class="text-xs text-slate-500">{{ appStore.currentUser?.roleName }}</div>
          </div>
          <ChevronDown class="h-4 w-4 text-slate-400" />
        </button>

        <div
          v-if="dropdownOpen"
          class="absolute right-0 top-full mt-2 w-56 origin-top-right animate-scale-in rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          <div class="border-b border-slate-100 px-4 py-3">
            <div class="text-sm font-medium text-slate-800">{{ appStore.currentUser?.realName }}</div>
            <div class="mt-1 inline-block rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
              {{ appStore.currentUser?.roleName }}
            </div>
          </div>
          <div class="py-1">
            <div class="flex items-center gap-2 px-4 py-2 text-xs text-slate-400">
              <UserCog class="h-4 w-4" /> 切换角色
            </div>
            <button
              v-for="opt in roleOptions"
              :key="opt.userId"
              type="button"
              :class="cn(
                'block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50',
                appStore.currentUser?.id === opt.userId ? 'text-brand-600' : 'text-slate-700'
              )"
              @click="handleSwitch(opt.userId)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
