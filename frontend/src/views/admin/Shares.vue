<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { shareApi, type ShareInfo, type AccessLogEntry } from '@/api/share';
import { useWorksStore } from '@/stores/works';
import { useClientsStore } from '@/stores/clients';

const shares = ref<ShareInfo[]>([]);
const loading = ref(true);
const showCreateDialog = ref(false);
const showAccessLogDialog = ref(false);

// Create share form
const selectedWorkIds = ref<string[]>([]);
const expiresInDays = ref(7);
const selectedClientId = ref<string>('');
const maxAccess = ref<number | undefined>(undefined);

// Access log data
const accessLogs = ref<AccessLogEntry[]>([]);
const accessLogsLoading = ref(false);
const currentShareToken = ref('');

const worksStore = useWorksStore();
const clientsStore = useClientsStore();

onMounted(async () => {
  await Promise.all([
    loadShares(),
    worksStore.fetchWorks(),
    clientsStore.fetchClients(),
  ]);
});

const loadShares = async () => {
  loading.value = true;
  try {
    shares.value = await shareApi.getShares();
  } finally {
    loading.value = false;
  }
};

const createShare = async () => {
  if (selectedWorkIds.value.length === 0) return;
  
  try {
    const result = await shareApi.createShare({
      workIds: selectedWorkIds.value,
      expiresInDays: expiresInDays.value,
      maxAccess: maxAccess.value || undefined,
      clientId: selectedClientId.value || undefined,
    });
    
    // Copy to clipboard
    await navigator.clipboard.writeText(result.shareUrl || '');
    alert('分享链接已创建并复制到剪贴板！');
    
    showCreateDialog.value = false;
    resetCreateForm();
    await loadShares();
  } catch (e: any) {
    alert('创建失败：' + e.message);
  }
};

const resetCreateForm = () => {
  selectedWorkIds.value = [];
  expiresInDays.value = 7;
  selectedClientId.value = '';
  maxAccess.value = undefined;
};

const copyShareUrl = async (share: ShareInfo) => {
  const url = share.shareUrl || `${window.location.origin}/share/${share.token}`;
  await navigator.clipboard.writeText(url);
  alert('链接已复制！');
};

const revokeShare = async (token: string) => {
  if (!confirm('确定要撤销这个分享链接吗？')) return;
  
  try {
    await shareApi.revokeShare(token);
    await loadShares();
  } catch (e: any) {
    alert('撤销失败：' + e.message);
  }
};

const loadAccessLogs = async (token: string) => {
  currentShareToken.value = token;
  accessLogsLoading.value = true;
  showAccessLogDialog.value = true;
  
  try {
    const result = await shareApi.getAccessLogs(token);
    accessLogs.value = result.logs;
  } catch (e) {
    console.error('Failed to load access logs:', e);
    accessLogs.value = [];
  } finally {
    accessLogsLoading.value = false;
  }
};

const formatDate = (timestamp: number | string) => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString('zh-CN');
};

const isExpired = (share: ShareInfo) => {
  return share.expiresAt < Date.now();
};

const getClientName = (clientId?: string) => {
  if (!clientId) return '-';
  const client = clients.value.find(c => c.id === clientId);
  return client?.name || '-';
};

const works = computed(() => worksStore.works);
const clients = computed(() => clientsStore.clients);
</script>

<template>
  <div class="shares-page">
    <div class="page-header">
      <h1>分享管理</h1>
      <button class="btn-primary" @click="showCreateDialog = true">
        创建分享链接
      </button>
    </div>
    
    <div class="shares-list">
      <table v-if="shares.length > 0">
        <thead>
          <tr>
            <th>作品数</th>
            <th>客户</th>
            <th>访问次数</th>
            <th>创建时间</th>
            <th>过期时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="share in shares" :key="share.token">
            <td>{{ share.workIds.length }}</td>
            <td>{{ getClientName(share.clientId) }}</td>
            <td>
              {{ share.accessCount || 0 }}
              <span v-if="share.maxAccess"> / {{ share.maxAccess }}</span>
            </td>
            <td>{{ formatDate(share.createdAt) }}</td>
            <td>{{ formatDate(share.expiresAt) }}</td>
            <td>
              <span :class="['status', isExpired(share) ? 'expired' : 'active']">
                {{ isExpired(share) ? '已过期' : '有效' }}
              </span>
            </td>
            <td class="actions">
              <button @click="copyShareUrl(share)" :disabled="isExpired(share)">
                复制链接
              </button>
              <button @click="loadAccessLogs(share.token)">访问记录</button>
              <button @click="revokeShare(share.token)" :disabled="isExpired(share)" class="danger">
                撤销
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="empty">
        暂无分享链接
      </div>
    </div>
    
    <!-- Create dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click.self="showCreateDialog = false">
      <div class="dialog">
        <h2>创建分享链接</h2>
        
        <div class="form-group">
          <label>选择作品</label>
          <div class="work-selector">
            <label v-for="work in works" :key="work.id" class="work-item">
              <input
                type="checkbox"
                :value="work.id"
                v-model="selectedWorkIds"
              />
              <span>{{ work.title }}</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>关联客户（可选）</label>
          <select v-model="selectedClientId">
            <option value="">不关联客户</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.name }}
            </option>
          </select>
        </div>
        
        <div class="form-group">
          <label>过期时间</label>
          <select v-model="expiresInDays">
            <option :value="1">1天</option>
            <option :value="7">7天</option>
            <option :value="30">30天</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>访问次数限制（可选）</label>
          <input
            type="number"
            v-model.number="maxAccess"
            min="1"
            placeholder="不限制"
          />
          <small class="hint">留空表示不限制访问次数</small>
        </div>
        
        <div class="dialog-actions">
          <button @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" @click="createShare" :disabled="selectedWorkIds.length === 0">
            创建并复制链接
          </button>
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
.shares-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-sizing: border-box;
}

.hint {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

.work-selector {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
}

.work-item {
  display: block;
  padding: 8px;
  cursor: pointer;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>