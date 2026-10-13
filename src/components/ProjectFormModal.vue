<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { cn } from '@/lib/utils'
import Modal from '@/components/Modal.vue'
import type { Project, Category, User } from '@/types'
import { api } from '@/api'

interface FormState {
  id: number
  name: string
  code: string
  categoryId: number
  ownerId: number
  startDate: string
  endDate: string
  progress: number
  description: string
}

const props = defineProps<{
  modelValue: boolean
  editProject: Project | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: FormState]
}>()

const isEdit = ref(false)
const errors = reactive<Record<string, boolean>>({})

const emptyForm = (): FormState => ({
  id: 0, name: '', code: '', categoryId: 1, ownerId: 4,
  startDate: '', endDate: '', progress: 0, description: '',
})

const form = ref<FormState>(emptyForm())

// 分类与负责人选项来自数据库
const categories = ref<Category[]>([])
const users = ref<User[]>([])
onMounted(async () => {
  const [cats, us] = await Promise.all([api.getCategories(), api.getUsers()])
  categories.value = cats.filter(c => c.enabled)
  users.value = us.filter(u => u.enabled)
})

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    if (props.editProject) {
      isEdit.value = true
      form.value = { ...props.editProject }
    } else {
      isEdit.value = false
      form.value = emptyForm()
    }
    Object.keys(errors).forEach(k => delete errors[k])
  },
)

const validate = () => {
  ;['name', 'code', 'startDate', 'endDate'].forEach(k => delete errors[k])
  if (!form.value.name.trim()) errors.name = true
  if (!form.value.code.trim()) errors.code = true
  if (!form.value.startDate) errors.startDate = true
  if (!form.value.endDate) errors.endDate = true
  return Object.keys(errors).length === 0
}

const handleSubmit = () => {
  if (!validate()) return false
  emit('submit', { ...form.value })
  emit('update:modelValue', false)
  return true
}

const cancel = () => emit('update:modelValue', false)
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="isEdit ? '编辑项目' : '新增项目'"
    width="max-w-2xl"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="grid grid-cols-2 gap-4">
      <div class="col-span-2">
        <label class="mb-1 block text-sm text-slate-600">项目名称 <span class="text-red-500">*</span></label>
        <input
          v-model="form.name"
          type="text"
          :class="cn('w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand-500', errors.name ? 'border-red-400' : 'border-slate-200 focus:border-brand-500')"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm text-slate-600">项目编号 <span class="text-red-500">*</span></label>
        <input
          v-model="form.code"
          type="text"
          :class="cn('w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand-500', errors.code ? 'border-red-400' : 'border-slate-200 focus:border-brand-500')"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm text-slate-600">分类</label>
        <select
          v-model="form.categoryId"
          class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-sm text-slate-600">负责人</label>
        <select
          v-model="form.ownerId"
          class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          <option v-for="u in users" :key="u.id" :value="u.id">{{ u.realName }}</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-sm text-slate-600">开始日期 <span class="text-red-500">*</span></label>
        <input
          v-model="form.startDate"
          type="date"
          :class="cn('w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand-500', errors.startDate ? 'border-red-400' : 'border-slate-200 focus:border-brand-500')"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm text-slate-600">结束日期 <span class="text-red-500">*</span></label>
        <input
          v-model="form.endDate"
          type="date"
          :class="cn('w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-brand-500', errors.endDate ? 'border-red-400' : 'border-slate-200 focus:border-brand-500')"
        />
      </div>
      <div class="col-span-2">
        <label class="mb-1 block text-sm text-slate-600">进度: {{ form.progress }}%</label>
        <input
          v-model.number="form.progress"
          type="range"
          min="0"
          max="100"
          class="w-full accent-brand-600"
        />
      </div>
      <div class="col-span-2">
        <label class="mb-1 block text-sm text-slate-600">描述</label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
    <template #footer>
      <button
        type="button"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
        @click="cancel"
      >取消</button>
      <button
        type="button"
        class="rounded-md bg-brand-600 px-4 py-2 text-sm text-white transition hover:bg-brand-700"
        @click="handleSubmit"
      >确认</button>
    </template>
  </Modal>
</template>
