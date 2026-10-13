<script setup lang="ts">
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import Topbar from '@/components/Topbar.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const collapsed = ref(false)
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-[#f8fafc]">
    <Sidebar v-model:collapsed="collapsed" />
    <div
      class="flex h-screen flex-col transition-all duration-300"
      :style="{ marginLeft: collapsed ? '64px' : '240px' }"
    >
      <Topbar class="h-16 shrink-0" />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
    <ToastContainer />
  </div>
</template>
