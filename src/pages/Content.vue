<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Eye, Power } from 'lucide-vue-next'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAppStore } from '@/stores/app'
import { api } from '@/api'
import { cn } from '@/lib/utils'
import type { Category, SystemParam, ContentItem } from '@/types'

const appStore = useAppStore()
type TabKey = 'category' | 'param' | 'content'
const activeTab = ref<TabKey>('category')
const tabs: { key: TabKey; label: string }[] = [
  { key: 'category', label: '分类管理' },
  { key: 'param', label: '参数配置' },
  { key: 'content', label: '内容维护' },
]
const today = () => new Date().toISOString().slice(0, 10)
const btnBase = 'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition'
const addBtn = btnBase + ' bg-brand-600 text-white hover:bg-brand-700 px-3 py-1.5'

// ===== 分类管理 =====
const categoryList = ref<Category[]>([])
const loadCategories = async () => { categoryList.value = await api.getCategories() }
const categoryModal = ref(false)
const categoryEditing = ref(false)
const categoryForm = ref<Category>({ id: 0, name: '', sort: 1, enabled: true, createdAt: '' })
const openCategoryAdd = () => { categoryEditing.value = false; categoryForm.value = { id: 0, name: '', sort: categoryList.value.length + 1, enabled: true, createdAt: today() }; categoryModal.value = true }
const openCategoryEdit = (item: Category) => { categoryEditing.value = true; categoryForm.value = { ...item }; categoryModal.value = true }
const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) return appStore.showToast('请输入分类名称', 'error')
  const f = categoryForm.value
  if (categoryEditing.value) await api.updateCategory(f.id, { name: f.name, sort: f.sort, enabled: f.enabled, color: f.color })
  else await api.createCategory({ name: f.name, sort: f.sort, enabled: f.enabled })
  appStore.showToast(categoryEditing.value ? '分类更新成功' : '分类新增成功')
  categoryModal.value = false
  await loadCategories()
}
const toggleCategory = async (item: Category) => {
  await api.updateCategory(item.id, { enabled: !item.enabled })
  await loadCategories()
  appStore.showToast(`分类已${!item.enabled ? '启用' : '停用'}`)
}
const deleteCategory = async (item: Category) => {
  await api.deleteCategory(item.id)
  await loadCategories()
  appStore.showToast('分类已删除')
}

// ===== 参数配置 =====
const paramList = ref<SystemParam[]>([])
const loadParams = async () => { paramList.value = await api.getParams() }
const paramModal = ref(false)
const paramEditing = ref(false)
const paramForm = ref<SystemParam>({ id: 0, key: '', value: '', description: '', updatedAt: '' })
const openParamAdd = () => { paramEditing.value = false; paramForm.value = { id: 0, key: '', value: '', description: '', updatedAt: today() }; paramModal.value = true }
const openParamEdit = (item: SystemParam) => { paramEditing.value = true; paramForm.value = { ...item }; paramModal.value = true }
const saveParam = async () => {
  if (!paramForm.value.key.trim() || !paramForm.value.value.trim()) return appStore.showToast('请填写参数键和值', 'error')
  const f = paramForm.value
  if (paramEditing.value) await api.updateParam(f.id, { key: f.key, value: f.value, description: f.description })
  else await api.createParam({ key: f.key, value: f.value, description: f.description })
  appStore.showToast(paramEditing.value ? '参数更新成功' : '参数新增成功')
  paramModal.value = false
  await loadParams()
}
const deleteParam = async (item: SystemParam) => {
  await api.deleteParam(item.id)
  await loadParams()
  appStore.showToast('参数已删除')
}

// ===== 内容维护 =====
const contentList = ref<ContentItem[]>([])
const loadContent = async () => { contentList.value = await api.getContent() }
const contentModal = ref(false)
const contentEditing = ref(false)
const contentForm = ref<ContentItem & { content?: string }>({ id: 0, title: '', category: '管理制度', author: '系统管理员', status: 'draft', updatedAt: '', content: '' })
const contentCategories = ['管理制度', '操作文档', '公告通知', '帮助文档']
const contentAuthors = ['系统管理员', '张伟', '李娜', '周婷', '郑爽']
const openContentAdd = () => { contentEditing.value = false; contentForm.value = { id: 0, title: '', category: '管理制度', author: '系统管理员', status: 'draft', updatedAt: today(), content: '' }; contentModal.value = true }
const openContentEdit = (item: ContentItem) => { contentEditing.value = true; contentForm.value = { ...item, content: `${item.title} 正文内容示例……` }; contentModal.value = true }
const saveContent = async () => {
  if (!contentForm.value.title.trim()) return appStore.showToast('请输入内容标题', 'error')
  const f = contentForm.value
  const payload = { title: f.title, category: f.category, author: f.author, status: f.status }
  if (contentEditing.value) await api.updateContent(f.id, payload)
  else await api.createContent(payload)
  appStore.showToast(contentEditing.value ? '内容更新成功' : '内容新增成功')
  contentModal.value = false
  await loadContent()
}
const previewContent = (item: ContentItem) => appStore.showToast(`预览：${item.title}`, 'info')
const deleteContent = async (item: ContentItem) => {
  await api.deleteContent(item.id)
  await loadContent()
  appStore.showToast('内容已删除')
}

onMounted(() => { loadCategories(); loadParams(); loadContent() })
</script>

<template>
  <div class="space-y-5">
    <h1 class="text-2xl font-bold text-slate-800">内容配置</h1>

    <!-- 白色卡片容器 + Tab 导航 -->
    <div class="rounded-lg bg-white shadow-card animate-fade-in-up">
      <div class="flex border-b border-slate-200">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          :class="cn('px-5 py-3.5 text-sm font-medium transition', activeTab === t.key ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700')"
          @click="activeTab = t.key"
        >{{ t.label }}</button>
      </div>

      <div class="p-5">
        <!-- Tab 1: 分类管理 -->
        <div v-show="activeTab === 'category'">
          <div class="mb-4 flex justify-end">
            <button type="button" :class="addBtn" @click="openCategoryAdd"><Plus class="h-4 w-4" /> 新增分类</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-xs text-slate-500">
                  <th class="px-3 py-3 font-medium">分类名称</th>
                  <th class="px-3 py-3 font-medium">排序</th>
                  <th class="px-3 py-3 font-medium">状态</th>
                  <th class="px-3 py-3 font-medium">创建时间</th>
                  <th class="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in categoryList" :key="c.id" class="table-row-hover border-b border-slate-100">
                  <td class="px-3 py-3 font-medium text-slate-800">{{ c.name }}</td>
                  <td class="px-3 py-3 text-slate-600">{{ c.sort }}</td>
                  <td class="px-3 py-3"><StatusBadge :status="c.enabled ? 'active' : 'disabled'" type="user" /></td>
                  <td class="px-3 py-3 text-slate-600">{{ c.createdAt }}</td>
                  <td class="px-3 py-3">
                    <div class="flex gap-1">
                      <button :class="btnBase + ' text-brand-600 hover:bg-brand-50'" @click="openCategoryEdit(c)"><Pencil class="h-3.5 w-3.5" />编辑</button>
                      <button :class="btnBase + ' text-amber-600 hover:bg-amber-50'" @click="toggleCategory(c)"><Power class="h-3.5 w-3.5" />{{ c.enabled ? '停用' : '启用' }}</button>
                      <button :class="btnBase + ' text-red-600 hover:bg-red-50'" @click="deleteCategory(c)"><Trash2 class="h-3.5 w-3.5" />删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 2: 参数配置 -->
        <div v-show="activeTab === 'param'">
          <div class="mb-4 flex justify-end">
            <button type="button" :class="addBtn" @click="openParamAdd"><Plus class="h-4 w-4" /> 新增参数</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-xs text-slate-500">
                  <th class="px-3 py-3 font-medium">参数键</th>
                  <th class="px-3 py-3 font-medium">参数值</th>
                  <th class="px-3 py-3 font-medium">描述</th>
                  <th class="px-3 py-3 font-medium">更新时间</th>
                  <th class="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in paramList" :key="p.id" class="table-row-hover border-b border-slate-100">
                  <td class="px-3 py-3 font-mono text-xs text-slate-700">{{ p.key }}</td>
                  <td class="px-3 py-3 font-medium text-slate-800">{{ p.value }}</td>
                  <td class="px-3 py-3 text-slate-600">{{ p.description }}</td>
                  <td class="px-3 py-3 text-slate-600">{{ p.updatedAt }}</td>
                  <td class="px-3 py-3">
                    <div class="flex gap-1">
                      <button :class="btnBase + ' text-brand-600 hover:bg-brand-50'" @click="openParamEdit(p)"><Pencil class="h-3.5 w-3.5" />编辑</button>
                      <button :class="btnBase + ' text-red-600 hover:bg-red-50'" @click="deleteParam(p)"><Trash2 class="h-3.5 w-3.5" />删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 3: 内容维护 -->
        <div v-show="activeTab === 'content'">
          <div class="mb-4 flex justify-end">
            <button type="button" :class="addBtn" @click="openContentAdd"><Plus class="h-4 w-4" /> 新增内容</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-slate-200 text-xs text-slate-500">
                  <th class="px-3 py-3 font-medium">标题</th>
                  <th class="px-3 py-3 font-medium">分类</th>
                  <th class="px-3 py-3 font-medium">作者</th>
                  <th class="px-3 py-3 font-medium">状态</th>
                  <th class="px-3 py-3 font-medium">更新时间</th>
                  <th class="px-3 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in contentList" :key="c.id" class="table-row-hover border-b border-slate-100">
                  <td class="px-3 py-3 font-medium text-slate-800">{{ c.title }}</td>
                  <td class="px-3 py-3 text-slate-600">{{ c.category }}</td>
                  <td class="px-3 py-3 text-slate-600">{{ c.author }}</td>
                  <td class="px-3 py-3">
                    <span v-if="c.status === 'published'" class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">已发布</span>
                    <span v-else class="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">草稿</span>
                  </td>
                  <td class="px-3 py-3 text-slate-600">{{ c.updatedAt }}</td>
                  <td class="px-3 py-3">
                    <div class="flex gap-1">
                      <button :class="btnBase + ' text-brand-600 hover:bg-brand-50'" @click="openContentEdit(c)"><Pencil class="h-3.5 w-3.5" />编辑</button>
                      <button :class="btnBase + ' text-accent-600 hover:bg-accent-50'" @click="previewContent(c)"><Eye class="h-3.5 w-3.5" />预览</button>
                      <button :class="btnBase + ' text-red-600 hover:bg-red-50'" @click="deleteContent(c)"><Trash2 class="h-3.5 w-3.5" />删除</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类 Modal -->
    <Modal v-model="categoryModal" :title="categoryEditing ? '编辑分类' : '新增分类'">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">分类名称</label>
          <input v-model="categoryForm.name" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="请输入分类名称" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">排序</label>
          <input v-model.number="categoryForm.sort" type="number" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700">启用状态</label>
          <button type="button" :class="cn('relative h-6 w-11 rounded-full transition', categoryForm.enabled ? 'bg-brand-600' : 'bg-slate-300')" @click="categoryForm.enabled = !categoryForm.enabled">
            <span :class="cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', categoryForm.enabled ? 'left-[22px]' : 'left-0.5')" />
          </button>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="categoryModal = false">取消</button>
        <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700" @click="saveCategory">确定</button>
      </template>
    </Modal>

    <!-- 参数 Modal -->
    <Modal v-model="paramModal" :title="paramEditing ? '编辑参数' : '新增参数'">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">参数键</label>
          <input v-model="paramForm.key" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="如：project_code_prefix" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">参数值</label>
          <input v-model="paramForm.value" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="请输入参数值" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">描述</label>
          <textarea v-model="paramForm.description" rows="3" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="请输入描述" />
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="paramModal = false">取消</button>
        <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700" @click="saveParam">确定</button>
      </template>
    </Modal>

    <!-- 内容 Modal -->
    <Modal v-model="contentModal" :title="contentEditing ? '编辑内容' : '新增内容'" width="max-w-2xl">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">标题</label>
          <input v-model="contentForm.title" type="text" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="请输入内容标题" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">分类</label>
            <select v-model="contentForm.category" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option v-for="cat in contentCategories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">作者</label>
            <select v-model="contentForm.author" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option v-for="au in contentAuthors" :key="au" :value="au">{{ au }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">正文内容</label>
          <textarea v-model="contentForm.content" rows="5" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="请输入正文内容" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">状态</label>
          <select v-model="contentForm.status" class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" @click="contentModal = false">取消</button>
        <button type="button" class="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700" @click="saveContent">确定</button>
      </template>
    </Modal>
  </div>
</template>
