<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  LayoutDashboard, FolderKanban, Users, ShieldCheck, BarChart3,
  Settings2, ScrollText, Cog, Boxes, ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'

interface Props {
  collapsed?: boolean
}
const props = withDefaults(defineProps<Props>(), { collapsed: false })
const emit = defineEmits<{ 'update:collapsed': [value: boolean] }>()

const route = useRoute()
const appStore = useAppStore()

const iconMap = {
  LayoutDashboard, FolderKanban, Users, ShieldCheck, BarChart3,
  Settings2, ScrollText, Cog, Boxes,
} as const

const resolveIcon = (name: string) => (iconMap as Record<string, any>)[name] || Boxes

const visibleMenus = computed(() => {
  const roleMenus = appStore.currentRole?.permissions?.menus || []
  return appStore.menus.filter(item => roleMenus.includes(item.id))
})

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}

const toggleCollapse = () => emit('update:collapsed', !props.collapsed)
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-30 flex h-screen flex-col bg-brand-950 transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo -->
    <div
      class="flex h-16 items-center border-b border-white/10"
      :class="collapsed ? 'justify-center px-2' : 'gap-2 px-4'"
    >
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 shadow-md">
        <Boxes class="h-5 w-5 text-white" />
      </div>
      <span
        v-if="!collapsed"
        class="whitespace-nowrap text-base font-bold text-white"
      >
        综合管理平台
      </span>
    </div>

    <!-- Menu -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
      <RouterLink
        v-for="item in visibleMenus"
        :key="item.id"
        :to="item.path"
        class="mb-1 flex items-center rounded-md text-sm font-medium transition-colors"
        :class="cn(
          collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2',
          isActive(item.path)
            ? 'bg-brand-800 text-white'
            : 'text-slate-300 hover:bg-brand-900 hover:text-white'
        )"
        :title="collapsed ? item.name : undefined"
      >
        <component :is="resolveIcon(item.icon)" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed" class="ml-3 truncate">{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Collapse toggle -->
    <button
      type="button"
      class="flex h-12 items-center justify-center border-t border-white/10 text-slate-300 transition-colors hover:bg-brand-900 hover:text-white"
      @click="toggleCollapse"
    >
      <ChevronsLeft v-if="!collapsed" class="h-5 w-5" />
      <ChevronsRight v-else class="h-5 w-5" />
    </button>
  </aside>
</template>
