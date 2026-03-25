<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { shareApi, type ShareInfo } from '@/api/share';
import { useWorksStore } from '@/stores/works';

const shares = ref<ShareInfo[]>([]);
const loading = ref(true);
const showCreateDialog = ref(false);

// Create share form
const selectedWorkIds = ref<string[]>([]);
const expiresInDays = ref(7);

const worksStore = useWorksStore();

onMounted(async () => {
  await Promise.all([
    loadShares(),
    worksStore.fetchWorks()
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
      expiresInDays: expiresInDays.value
    });
    
    // Copy to clipboard
    await navigator.clipboard.writeText(result.shareUrl || '');
    alert('分享链接已创建并复制到剪贴板！');
    
    showCreateDialog.value = false;
    selectedWorkIds.value = [];
    await loadShares();
  } catch (e: any) {
    alert('创建失败：' + e.message);
  }
};

const copyShareUrl = async (share: ShareInfo) => {
  if (share.shareUrl) {
    await navigator.clipboard.writeText(share.shareUrl);
    alert('链接已复制！');
  }
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

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const isExpired = (share: ShareInfo) => {
  return share.expiresAt < Date.now();
};

const works = computed(() => worksStore.works);
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
            <th>创建时间</th>
            <th>过期时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="share in shares" :key="share.token">
            <td>{{ share.workIds.length }}</td>
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
          <label>过期时间</label>
          <select v-model="expiresInDays">
            <option :value="1">1天</option>
            <option :value="7">7天</option>
            <option :value="30">30天</option>
          </select>
        </div>
        
        <div class="dialog-actions">
          <button @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" @click="createShare" :disabled="selectedWorkIds.length === 0">
            创建并复制链接
          </button>
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
  background: #d4edda;
  color: #155724;
}

.status.expired {
  background: #f8d7da;
  color: #721c24;
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

.empty {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
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