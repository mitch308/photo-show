<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import {
  useClientsStore,
  type ClientShareInfo,
} from '@/stores/clients';
import { shareApi, type AccessLogEntry } from '@/api/share';
import type { Client, CreateClientRequest, UpdateClientRequest } from '@/api/clients';

const clientsStore = useClientsStore();

// UI state
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDetailDialog = ref(false);
const showAccessLogDialog = ref(false);
const searchQuery = ref('');
const selectedClient = ref<Client | null>(null);
const editingClient = ref<Client | null>(null);

// Form data
const formData = ref<CreateClientRequest>({
  name: '',
  phone: '',
  email: '',
  company: '',
  address: '',
  birthday: '',
  notes: '',
});

// Detail view data
const clientShares = ref<ClientShareInfo[]>([]);
const accessLogs = ref<AccessLogEntry[]>([]);
const accessLogsLoading = ref(false);

onMounted(async () => {
  await clientsStore.fetchClients();
});

// Search with debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    clientsStore.fetchClients({ search: searchQuery.value });
  }, 300);
});

// CRUD operations
const openCreateDialog = () => {
  formData.value = {
    name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    birthday: '',
    notes: '',
  };
  showCreateDialog.value = true;
};

const createClient = async () => {
  if (!formData.value.name) return;
  
  try {
    await clientsStore.createClient(formData.value);
    showCreateDialog.value = false;
  } catch (e: any) {
    alert('创建失败：' + e.message);
  }
};

const openEditDialog = (client: Client) => {
  editingClient.value = client;
  formData.value = {
    name: client.name,
    phone: client.phone,
    email: client.email,
    company: client.company,
    address: client.address,
    birthday: client.birthday || '',
    notes: client.notes,
  };
  showEditDialog.value = true;
};

const updateClient = async () => {
  if (!editingClient.value || !formData.value.name) return;
  
  try {
    const updateData: UpdateClientRequest = {
      name: formData.value.name,
      phone: formData.value.phone,
      email: formData.value.email,
      company: formData.value.company,
      address: formData.value.address,
      birthday: formData.value.birthday || null,
      notes: formData.value.notes,
    };
    
    await clientsStore.updateClient(editingClient.value.id, updateData);
    showEditDialog.value = false;
    editingClient.value = null;
  } catch (e: any) {
    alert('更新失败：' + e.message);
  }
};

const deleteClient = async (client: Client) => {
  if (!confirm(`确定要删除客户"${client.name}"吗？`)) return;
  
  try {
    await clientsStore.deleteClient(client.id);
    if (selectedClient.value?.id === client.id) {
      showDetailDialog.value = false;
    }
  } catch (e: any) {
    alert('删除失败：' + e.message);
  }
};

// Detail view
const openDetailDialog = async (client: Client) => {
  selectedClient.value = client;
  showDetailDialog.value = true;
  
  // Load client shares
  try {
    await clientsStore.fetchClientShares(client.id);
    clientShares.value = clientsStore.clientShares;
  } catch (e) {
    console.error('Failed to load shares:', e);
    clientShares.value = [];
  }
};

const loadAccessLogs = async (share: ClientShareInfo) => {
  accessLogsLoading.value = true;
  showAccessLogDialog.value = true;
  
  try {
    const result = await shareApi.getAccessLogs(share.token);
    accessLogs.value = result.logs;
  } catch (e) {
    console.error('Failed to load access logs:', e);
    accessLogs.value = [];
  } finally {
    accessLogsLoading.value = false;
  }
};

// Utilities
const formatDate = (date: string | Date | number | null) => {
  if (!date) return '-';
  if (typeof date === 'number') {
    return new Date(date).toLocaleString('zh-CN');
  }
  return new Date(date).toLocaleString('zh-CN');
};

const isShareExpired = (share: ClientShareInfo) => {
  return share.expiresAt < Date.now();
};

const copyShareUrl = async (token: string) => {
  const url = `${window.location.origin}/share/${token}`;
  await navigator.clipboard.writeText(url);
  alert('链接已复制！');
};

const clients = computed(() => clientsStore.clients);
const loading = computed(() => clientsStore.loading);
</script>

<template>
  <div class="clients-page">
    <div class="page-header">
      <h1>客户管理</h1>
      <div class="header-actions">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索客户..."
          class="search-input"
        />
        <button class="btn-primary" @click="openCreateDialog">
          添加客户
        </button>
      </div>
    </div>
    
    <div class="clients-list">
      <table v-if="clients.length > 0">
        <thead>
          <tr>
            <th>姓名</th>
            <th>电话</th>
            <th>邮箱</th>
            <th>公司</th>
            <th>分享数</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.id">
            <td>{{ client.name }}</td>
            <td>{{ client.phone || '-' }}</td>
            <td>{{ client.email || '-' }}</td>
            <td>{{ client.company || '-' }}</td>
            <td>{{ client.shareCount }}</td>
            <td>{{ formatDate(client.createdAt) }}</td>
            <td class="actions">
              <button @click="openDetailDialog(client)">详情</button>
              <button @click="openEditDialog(client)">编辑</button>
              <button @click="deleteClient(client)" class="danger">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else-if="!loading" class="empty">
        暂无客户数据
      </div>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
    </div>
    
    <!-- Create Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h2>添加客户</h2>
        
        <div class="form-group">
          <label>姓名 *</label>
          <input v-model="formData.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>电话</label>
          <input v-model="formData.phone" type="text" />
        </div>
        
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="formData.email" type="email" />
        </div>
        
        <div class="form-group">
          <label>公司</label>
          <input v-model="formData.company" type="text" />
        </div>
        
        <div class="form-group">
          <label>地址</label>
          <input v-model="formData.address" type="text" />
        </div>
        
        <div class="form-group">
          <label>生日</label>
          <input v-model="formData.birthday" type="date" />
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="formData.notes" rows="3"></textarea>
        </div>
        
        <div class="dialog-actions">
          <button @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" @click="createClient" :disabled="!formData.name">
            创建
          </button>
        </div>
      </div>
    </div>
    
    <!-- Edit Dialog -->
    <div v-if="showEditDialog" class="dialog-overlay" @click.self="showEditDialog = false">
      <div class="dialog">
        <h2>编辑客户</h2>
        
        <div class="form-group">
          <label>姓名 *</label>
          <input v-model="formData.name" type="text" required />
        </div>
        
        <div class="form-group">
          <label>电话</label>
          <input v-model="formData.phone" type="text" />
        </div>
        
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="formData.email" type="email" />
        </div>
        
        <div class="form-group">
          <label>公司</label>
          <input v-model="formData.company" type="text" />
        </div>
        
        <div class="form-group">
          <label>地址</label>
          <input v-model="formData.address" type="text" />
        </div>
        
        <div class="form-group">
          <label>生日</label>
          <input v-model="formData.birthday" type="date" />
        </div>
        
        <div class="form-group">
          <label>备注</label>
          <textarea v-model="formData.notes" rows="3"></textarea>
        </div>
        
        <div class="dialog-actions">
          <button @click="showEditDialog = false">取消</button>
          <button class="btn-primary" @click="updateClient" :disabled="!formData.name">
            保存
          </button>
        </div>
      </div>
    </div>
    
    <!-- Detail Dialog -->
    <div v-if="showDetailDialog && selectedClient" class="dialog-overlay" @click.self="showDetailDialog = false">
      <div class="dialog detail-dialog">
        <h2>客户详情</h2>
        
        <div class="client-info">
          <div class="info-row">
            <span class="label">姓名:</span>
            <span>{{ selectedClient.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">电话:</span>
            <span>{{ selectedClient.phone || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">邮箱:</span>
            <span>{{ selectedClient.email || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">公司:</span>
            <span>{{ selectedClient.company || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">地址:</span>
            <span>{{ selectedClient.address || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">生日:</span>
            <span>{{ selectedClient.birthday ? formatDate(selectedClient.birthday) : '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">备注:</span>
            <span>{{ selectedClient.notes || '-' }}</span>
          </div>
        </div>
        
        <h3>分享链接</h3>
        <div class="shares-section">
          <table v-if="clientShares.length > 0">
            <thead>
              <tr>
                <th>作品数</th>
                <th>过期时间</th>
                <th>访问次数</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="share in clientShares" :key="share.token">
                <td>{{ share.workIds.length }}</td>
                <td>{{ formatDate(share.expiresAt) }}</td>
                <td>{{ share.accessCount || 0 }} / {{ share.maxAccess || '无限' }}</td>
                <td>
                  <span :class="['status', isShareExpired(share) ? 'expired' : 'active']">
                    {{ isShareExpired(share) ? '已过期' : '有效' }}
                  </span>
                </td>
                <td class="actions">
                  <button @click="copyShareUrl(share.token)" :disabled="isShareExpired(share)">
                    复制链接
                  </button>
                  <button @click="loadAccessLogs(share)">访问记录</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-shares">
            暂无分享链接
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="showDetailDialog = false">关闭</button>
        </div>
      </div>
    </div>
    
    <!-- Access Log Dialog -->
    <div v-if="showAccessLogDialog" class="dialog-overlay" @click.self="showAccessLogDialog = false">
      <div class="dialog">
        <h2>访问记录</h2>
        
        <div v-if="accessLogsLoading" class="loading">加载中...</div>
        
        <table v-else-if="accessLogs.length > 0">
          <thead>
            <tr>
              <th>操作</th>
              <th>IP 地址</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in accessLogs" :key="log.id">
              <td>
                <span :class="['action-tag', log.action]">
                  {{ log.action === 'view' ? '查看' : '下载' }}
                </span>
              </td>
              <td>{{ log.ipAddress }}</td>
              <td>{{ formatDate(log.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        
        <div v-else class="empty">暂无访问记录</div>
        
        <div class="dialog-actions">
          <button @click="showAccessLogDialog = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.clients-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  min-width: 200px;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: 8px;
  overflow: hidden;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.active {
  background: rgba(103, 194, 58, 0.15);
  color: var(--color-success);
}

.status.expired {
  background: rgba(245, 108, 108, 0.15);
  color: var(--color-danger);
}

.action-tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.action-tag.view {
  background: rgba(64, 158, 255, 0.15);
  color: var(--color-primary);
}

.action-tag.download {
  background: rgba(230, 162, 60, 0.15);
  color: var(--color-warning);
}

.actions button {
  margin-right: 8px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.actions button.danger {
  color: #dc3545;
}

.empty, .loading {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--bg-card);
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-dialog {
  max-width: 800px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-sizing: border-box;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* Detail view */
.client-info {
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row .label {
  width: 80px;
  font-weight: 500;
  color: var(--text-secondary);
}

.shares-section {
  margin-top: 16px;
}

.shares-section table {
  font-size: 14px;
}

.empty-shares {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: 8px;
}
</style>