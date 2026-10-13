<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  Plus, ChevronRight, ToggleLeft, ToggleRight, Save,
} from 'lucide-vue-next'
import { api } from '@/api'
import type { PermissionNode } from '@/api'
import { useAppStore } from '@/stores/app'
import { cn } from '@/lib/utils'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Role } from '@/types'

const appStore = useAppStore()

// 角色列表与权限树（来自数据库）
const roleList = ref<Role[]>([])
const permissionTree = ref<PermissionNode[]>([])
const loaded = ref(false)

const selectedRoleId = ref<number>(0)
const selectedRole = computed(
  () => roleList.value.find(r => r.id === selectedRoleId.value) || roleList.value[0],
)

type TabKey = 'menu' | 'operation' | 'data'
const tabs = [
  { key: 'menu' as const, label: '菜单权限' },
  { key: 'operation' as const, label: '操作权限' },
  { key: 'data' as const, label: '数据权限' },
]
const activeTab = ref<TabKey>('menu')

const expandedNodes = ref<Set<number>>(new Set())
const menuChecked = ref<Set<number>>(new Set())
const opChecked = ref<Set<number>>(new Set())
const dataScope = ref<'all' | 'department' | 'self'>('all')

const allChildren = computed(() => permissionTree.value.flatMap(n => n.children || []))

const dataScopeOptions = [
  { v: 'all' as const, label: '全部数据', desc: '可查看系统中所有数据' },
  { v: 'department' as const, label: '本部门数据', desc: '仅可查看本部门的数据' },
  { v: 'self' as const, label: '仅本人数据', desc: '仅可查看本人创建的数据' },
]

// 初始化权限编辑状态
const initPermissionState = () => {
  const role = selectedRole.value
  if (!role) return
  menuChecked.value = new Set(role.permissions.menus)
  const ops = role.permissions.operations
  // 优先直接匹配子节点 id，否则按数量取前 N 个子节点（原型演示）
  const direct = allChildren.value.filter(c => ops.includes(c.id))
  opChecked.value = direct.length > 0
    ? new Set(direct.map(c => c.id))
    : new Set(allChildren.value.slice(0, ops.length).map(c => c.id))
  dataScope.value = role.permissions.dataScope
}

watch(selectedRoleId, () => { if (loaded.value) initPermissionState() })

onMounted(async () => {
  const [roleData, tree] = await Promise.all([api.getRoles(), api.getPermissionTree()])
  roleList.value = roleData
  permissionTree.value = tree
  expandedNodes.value = new Set(tree.map(n => n.id))
  selectedRoleId.value = roleData[0]?.id ?? 0
  loaded.value = true
  initPermissionState()
})

// 集合切换辅助
const toggleSet = (set: Set<number>, id: number) => {
  const next = new Set(set)
  next.has(id) ? next.delete(id) : next.add(id)
  return next
}
const toggleMenu = (id: number) => { menuChecked.value = toggleSet(menuChecked.value, id) }
const toggleOp = (id: number) => { opChecked.value = toggleSet(opChecked.value, id) }
const toggleExpand = (id: number) => { expandedNodes.value = toggleSet(expandedNodes.value, id) }

const toggleParentOps = (parent: PermissionNode) => {
  const childIds = (parent.children || []).map(c => c.id)
  const allChecked = childIds.length > 0 && childIds.every(id => opChecked.value.has(id))
  const next = new Set(opChecked.value)
  childIds.forEach(id => (allChecked ? next.delete(id) : next.add(id)))
  opChecked.value = next
}
const parentOpChecked = (parent: PermissionNode) => {
  const children = parent.children || []
  return children.length > 0 && children.every(c => opChecked.value.has(c.id))
}

const savePermissions = async () => {
  const role = selectedRole.value
  if (!role) return
  const updated = await api.updateRole(role.id, {
    permissions: {
      menus: [...menuChecked.value],
      operations: [...opChecked.value],
      dataScope: dataScope.value,
    },
  })
  const idx = roleList.value.findIndex(r => r.id === role.id)
  if (idx > -1) roleList.value[idx] = updated
  appStore.showToast('权限保存成功', 'success')
}

// 新增角色
const roleModal = ref(false)
const newRole = reactive({ name: '', description: '' })
const openAddRole = () => {
  newRole.name = ''
  newRole.description = ''
  roleModal.value = true
}
const createRole = async () => {
  const created = await api.createRole({ name: newRole.name, description: newRole.description })
  appStore.showToast('角色创建成功', 'success')
  roleModal.value = false
  roleList.value = await api.getRoles()
  selectedRoleId.value = created.id
}

// 角色启停
const toggleRoleModal = ref(false)
const toggleTarget = ref<Role | null>(null)
const openToggleRole = (role: Role) => {
  toggleTarget.value = role
  toggleRoleModal.value = true
}
const toggleRoleText = computed(() => (toggleTarget.value?.enabled ? '停用' : '启用'))
const confirmToggleRole = async () => {
  if (toggleTarget.value) {
    const next = !toggleTarget.value.enabled
    await api.setRoleEnabled(toggleTarget.value.id, next)
    appStore.showToast(next ? '角色已启用' : '角色已停用', 'success')
  }
  toggleRoleModal.value = false
  roleList.value = await api.getRoles()
}
</script>

<template>
  <div class="space-y-4">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">角色权限管理</h1>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
        @click="openAddRole"
      >
        <Plus class="h-4 w-4" /> 新增角色
      </button>
    </div>

    <!-- 两列布局 -->
    <div class="grid grid-cols-3 gap-4">
      <!-- 左侧角色列表 -->
      <div class="col-span-1 rounded-lg border border-slate-200 bg-white p-3 shadow-card">
        <div class="mb-3 px-1 text-sm font-semibold text-slate-700">角色列表</div>
        <div class="space-y-2">
          <div
            v-for="role in roleList"
            :key="role.id"
            :class="cn(
              'cursor-pointer rounded-lg border p-3 transition',
              selectedRoleId === role.id
                ? 'border-brand-300 bg-brand-50'
                : 'border-slate-200 bg-white hover:bg-slate-50',
            )"
            @click="selectedRoleId = role.id"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-800">{{ role.name }}</span>
              <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {{ role.userCount }} 人
              </span>
            </div>
            <div class="mt-1 truncate text-xs text-slate-500">{{ role.description }}</div>
            <div class="mt-2 flex items-center justify-between">
              <StatusBadge :status="role.enabled ? 'active' : 'disabled'" type="user" />
              <button
                type="button"
                :class="cn('inline-flex items-center gap-1 text-xs transition', role.enabled ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700')"
                @click.stop="openToggleRole(role)"
              >
                <component :is="role.enabled ? ToggleRight : ToggleLeft" class="h-4 w-4" />
                {{ role.enabled ? '停用' : '启用' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧权限配置 -->
      <div class="col-span-2 rounded-lg border border-slate-200 bg-white shadow-card">
        <div class="border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-800">{{ selectedRole?.name }}权限配置</h2>
        </div>
        <!-- Tabs -->
        <div class="flex border-b border-slate-200 px-5">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition',
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab content -->
        <div class="max-h-[480px] overflow-y-auto p-5">
          <!-- 菜单权限 -->
          <div v-if="activeTab === 'menu'" class="space-y-1">
            <div v-for="node in permissionTree" :key="node.id">
              <div class="flex items-center gap-2 py-1.5">
                <button type="button" class="rounded p-0.5 text-slate-400 hover:text-slate-600" @click="toggleExpand(node.id)">
                  <ChevronRight :class="['h-4 w-4 transition-transform', expandedNodes.has(node.id) ? 'rotate-90' : '']" />
                </button>
                <input type="checkbox" :checked="menuChecked.has(node.id)" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" @change="toggleMenu(node.id)" />
                <span class="text-sm font-medium text-slate-700">{{ node.label }}</span>
              </div>
              <div v-if="expandedNodes.has(node.id)" class="ml-7 space-y-1 border-l border-slate-100 pl-4">
                <div v-for="child in node.children" :key="child.id" class="flex items-center gap-2 py-1">
                  <input type="checkbox" :checked="menuChecked.has(node.id)" disabled class="h-4 w-4 rounded border-slate-300 text-brand-600" />
                  <span class="text-sm text-slate-600">{{ child.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作权限 -->
          <div v-else-if="activeTab === 'operation'" class="space-y-1">
            <div v-for="node in permissionTree" :key="node.id">
              <div class="flex items-center gap-2 py-1.5">
                <button type="button" class="rounded p-0.5 text-slate-400 hover:text-slate-600" @click="toggleExpand(node.id)">
                  <ChevronRight :class="['h-4 w-4 transition-transform', expandedNodes.has(node.id) ? 'rotate-90' : '']" />
                </button>
                <input type="checkbox" :checked="parentOpChecked(node)" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" @change="toggleParentOps(node)" />
                <span class="text-sm font-medium text-slate-700">{{ node.label }}</span>
              </div>
              <div v-if="expandedNodes.has(node.id)" class="ml-7 space-y-1 border-l border-slate-100 pl-4">
                <div v-for="child in node.children" :key="child.id" class="flex items-center gap-2 py-1">
                  <input type="checkbox" :checked="opChecked.has(child.id)" class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" @change="toggleOp(child.id)" />
                  <span class="text-sm text-slate-600">{{ child.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据权限 -->
          <div v-else class="space-y-3">
            <label
              v-for="opt in dataScopeOptions"
              :key="opt.v"
              :class="cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
                dataScope === opt.v ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:bg-slate-50',
              )"
            >
              <input type="radio" name="dataScope" :value="opt.v" :checked="dataScope === opt.v" class="mt-0.5 h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500" @change="dataScope = opt.v" />
              <div>
                <div class="text-sm font-medium text-slate-800">{{ opt.label }}</div>
                <div class="text-xs text-slate-500">{{ opt.desc }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="flex justify-end border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
            @click="savePermissions"
          >
            <Save class="h-4 w-4" /> 保存权限
          </button>
        </div>
      </div>
    </div>

    <!-- 新增角色弹窗 -->
    <Modal v-model="roleModal" title="新增角色" width="max-w-md">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">角色名称</label>
          <input v-model="newRole.name" type="text" class="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">描述</label>
          <textarea v-model="newRole.description" rows="3" class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"></textarea>
        </div>
      </div>
      <template #footer>
        <button type="button" class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50" @click="roleModal = false">取消</button>
        <button type="button" class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700" @click="createRole">确认</button>
      </template>
    </Modal>

    <!-- 角色启停确认 -->
    <Modal v-model="toggleRoleModal" :title="`${toggleRoleText}确认`" width="max-w-md">
      <div class="text-sm text-slate-600">确认{{ toggleRoleText }}角色「{{ toggleTarget?.name }}」？</div>
      <template #footer>
        <button type="button" class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50" @click="toggleRoleModal = false">取消</button>
        <button type="button" class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700" @click="confirmToggleRole">确认</button>
      </template>
    </Modal>
  </div>
</template>
