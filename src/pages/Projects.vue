<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import {
  Plus, Search, RotateCcw, Edit, MoreVertical, Trash2,
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import Pagination from '@/components/Pagination.vue'
import ProjectFormModal from '@/components/ProjectFormModal.vue'
import { api } from '@/api'
import type { Project, ProjectStatus, Category, User } from '@/types'

const appStore = useAppStore()
const projectList = ref<Project[]>([])
const categories = ref<Category[]>([])
const users = ref<User[]>([])

const loadProjects = async () => { projectList.value = await api.getProjects() }
const loadOptions = async () => {
  const [cats, us] = await Promise.all([api.getCategories(), api.getUsers()])
  categories.value = cats
  users.value = us
}
onMounted(() => { loadProjects(); loadOptions() })

const filters = reactive({
  name: '',
  status: '' as '' | ProjectStatus,
  categoryId: '' as number | '',
  owner: '',
})

const page = ref(1)
const pageSize = 10

const filteredProjects = computed(() =>
  projectList.value.filter(p => {
    if (filters.name && !p.name.includes(filters.name)) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.categoryId !== '' && p.categoryId !== filters.categoryId) return false
    if (filters.owner && !p.ownerName.includes(filters.owner)) return false
    return true
  })
)

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredProjects.value.slice(start, start + pageSize)
})

const handleSearch = () => { page.value = 1 }
const handleReset = () => {
  Object.assign(filters, { name: '', status: '', categoryId: '', owner: '' })
  page.value = 1
}

const progressColor = (val: number) =>
  val < 50 ? 'bg-brand-500' : val <= 80 ? 'bg-amber-500' : 'bg-green-500'

// 新增/编辑
const formModalVisible = ref(false)
const editProject = ref<Project | null>(null)

const openCreate = () => {
  const count = projectList.value.length + 1
  editProject.value = {
    id: 0, name: '', code: `PRJ-2026-${String(count).padStart(3, '0')}`,
    categoryId: 1, categoryName: '', ownerId: 4, ownerName: '',
    status: 'active', progress: 0, startDate: '', endDate: '', description: '',
  }
  formModalVisible.value = true
}

const openEdit = (project: Project) => {
  editProject.value = { ...project }
  formModalVisible.value = true
}

const handleFormSubmit = async (data: NonNullable<typeof editProject.value>) => {
  if (!data) return
  const payload = {
    name: data.name,
    code: data.code,
    categoryId: Number(data.categoryId),
    ownerId: Number(data.ownerId),
    progress: Number(data.progress),
    startDate: data.startDate,
    endDate: data.endDate,
    description: data.description,
  }
  if (editProject.value?.id) {
    await api.updateProject(editProject.value.id, payload)
    appStore.showToast('项目编辑成功', 'success')
  } else {
    await api.createProject(payload)
    appStore.showToast('项目创建成功', 'success')
  }
  formModalVisible.value = false
  await loadProjects()
}

// 状态切换
const openStatusId = ref<number | null>(null)
const statusModal = reactive({
  visible: false,
  project: null as Project | null,
  nextStatus: '' as ProjectStatus,
})

const statusOptions = (current: ProjectStatus) => {
  const opts: { value: ProjectStatus; label: string }[] = []
  if (current === 'active') opts.push({ value: 'disabled', label: '切换为禁用' })
  if (current === 'disabled') opts.push({ value: 'active', label: '切换为启用' })
  if (current !== 'archived') opts.push({ value: 'archived', label: '归档' })
  return opts
}

const toggleStatusDropdown = (id: number) => {
  openStatusId.value = openStatusId.value === id ? null : id
}

const openStatusModal = (project: Project, next: ProjectStatus) => {
  statusModal.project = project
  statusModal.nextStatus = next
  statusModal.visible = true
  openStatusId.value = null
}

const confirmStatusChange = async () => {
  if (statusModal.project) {
    await api.setProjectStatus(statusModal.project.id, statusModal.nextStatus)
  }
  statusModal.visible = false
  appStore.showToast('项目状态已更新', 'success')
  await loadProjects()
}

// 删除
const deleteModal = reactive({ visible: false, project: null as Project | null })

const openDeleteModal = (project: Project) => {
  deleteModal.project = project
  deleteModal.visible = true
}

const confirmDelete = async () => {
  if (deleteModal.project) {
    await api.deleteProject(deleteModal.project.id)
  }
  deleteModal.visible = false
  appStore.showToast('删除成功', 'success')
  await loadProjects()
}

const closeStatusDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.status-dropdown-trigger')) openStatusId.value = null
}
onMounted(() => document.addEventListener('click', closeStatusDropdown))
onUnmounted(() => document.removeEventListener('click', closeStatusDropdown))
</script>

<template>
  <div class="space-y-4">
    <!-- 页面头部 -->
    <div class="flex items-center justify-between animate-fade-in-up">
      <h1 class="text-2xl font-bold text-slate-800">项目管理</h1>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" /> 新增项目
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="rounded-lg bg-white p-4 shadow-card animate-fade-in-up" style="animation-delay:60ms">
      <div class="grid grid-cols-5 gap-3">
        <input v-model="filters.name" type="text" placeholder="项目名称"
          class="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        <select v-model="filters.status"
          class="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="">全部状态</option>
          <option value="active">启用</option>
          <option value="disabled">禁用</option>
          <option value="archived">归档</option>
        </select>
        <select v-model="filters.categoryId"
          class="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <input v-model="filters.owner" type="text" placeholder="负责人"
          class="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
        <div class="flex gap-2">
          <button type="button"
            class="flex items-center gap-1 rounded-md bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700"
            @click="handleSearch">
            <Search class="h-4 w-4" /> 搜索
          </button>
          <button type="button"
            class="flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            @click="handleReset">
            <RotateCcw class="h-4 w-4" /> 重置
          </button>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="overflow-hidden rounded-lg bg-white shadow-card animate-fade-in-up" style="animation-delay:120ms">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-xs uppercase text-gray-500">
              <th class="px-4 py-3 text-left font-medium">项目编号</th>
              <th class="px-4 py-3 text-left font-medium">项目名称</th>
              <th class="px-4 py-3 text-left font-medium">分类</th>
              <th class="px-4 py-3 text-left font-medium">负责人</th>
              <th class="px-4 py-3 text-left font-medium">进度</th>
              <th class="px-4 py-3 text-left font-medium">状态</th>
              <th class="px-4 py-3 text-left font-medium">开始日期</th>
              <th class="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in pagedProjects" :key="project.id"
              class="border-t border-slate-100 transition hover:bg-gray-50">
              <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ project.code }}</td>
              <td class="px-4 py-3 font-medium text-slate-800">{{ project.name }}</td>
              <td class="px-4 py-3 text-slate-600">{{ project.categoryName }}</td>
              <td class="px-4 py-3 text-slate-600">{{ project.ownerName }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200">
                    <div :class="cn('h-full rounded-full transition-all', progressColor(project.progress))"
                      :style="{ width: `${project.progress}%` }" />
                  </div>
                  <span class="text-xs text-slate-500">{{ project.progress }}%</span>
                </div>
              </td>
              <td class="px-4 py-3"><StatusBadge :status="project.status" type="project" /></td>
              <td class="px-4 py-3 text-slate-600">{{ project.startDate }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button type="button" title="编辑"
                    class="rounded p-1 text-brand-600 transition hover:bg-brand-50" @click="openEdit(project)">
                    <Edit class="h-4 w-4" />
                  </button>
                  <div class="relative">
                    <button type="button" title="状态切换"
                      class="status-dropdown-trigger rounded p-1 text-slate-500 transition hover:bg-slate-100"
                      @click.stop="toggleStatusDropdown(project.id)">
                      <MoreVertical class="h-4 w-4" />
                    </button>
                    <div v-if="openStatusId === project.id"
                      class="absolute right-0 top-full z-10 mt-1 w-40 origin-top-right animate-scale-in rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                      <button v-for="opt in statusOptions(project.status)" :key="opt.value" type="button"
                        class="block w-full px-3 py-1.5 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                        @click="openStatusModal(project, opt.value)">
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>
                  <button type="button" title="删除"
                    class="rounded p-1 text-red-500 transition hover:bg-red-50" @click="openDeleteModal(project)">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="pagedProjects.length === 0">
              <td colspan="8" class="px-4 py-10 text-center text-sm text-slate-400">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="border-t border-slate-100 p-4">
        <Pagination :total="filteredProjects.length" :page="page" :page-size="pageSize"
          @update:page="page = $event" />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ProjectFormModal
      v-model="formModalVisible"
      :edit-project="editProject"
      @submit="handleFormSubmit"
    />

    <!-- 状态变更确认 -->
    <Modal v-model="statusModal.visible" title="确认修改项目状态?" width="max-w-md">
      <p class="text-sm text-slate-600">
        确定要将项目「{{ statusModal.project?.name }}」状态修改为
        <span class="font-medium text-slate-800">
          {{ statusModal.nextStatus === 'active' ? '启用' : statusModal.nextStatus === 'disabled' ? '禁用' : '归档' }}
        </span> 吗？
      </p>
      <template #footer>
        <button type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          @click="statusModal.visible = false">取消</button>
        <button type="button"
          class="rounded-md bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
          @click="confirmStatusChange">确认</button>
      </template>
    </Modal>

    <!-- 删除确认 -->
    <Modal v-model="deleteModal.visible" title="确认删除" width="max-w-md">
      <p class="text-sm text-slate-600">
        确认删除项目「{{ deleteModal.project?.name }}」？<span class="text-red-500">此操作不可撤销</span>
      </p>
      <template #footer>
        <button type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          @click="deleteModal.visible = false">取消</button>
        <button type="button"
          class="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
          @click="confirmDelete">删除</button>
      </template>
    </Modal>
  </div>
</template>
