<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { shareApi, type ShareInfo, type AccessLogEntry } from '@/api/share';
import { useWorksStore } from '@/stores/works';
import { useClientsStore } from '@/stores/clients';

const shares = ref<ShareInfo[]>([]);
const loading = ref(true);

// Filter state
const clientFilter = ref('');
const typeFilter = ref('');

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

// Watch filter changes
watch([clientFilter, typeFilter], () => {
  loadShares();
});

const loadShares = async () => {
  loading.value = true;
  try {
    shares.value = await shareApi.getShares({
      clientId: clientFilter.value || undefined,
      type: typeFilter.value as 'work' | 'album' | undefined,
    });
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
    ElMessage.success('分享链接已创建并复制到剪贴板！');
    
    showCreateDialog.value = false;
    resetCreateForm();
    await loadShares();
  } catch (e: any) {
    ElMessage.error('创建失败：' + e.message);
  }
};

const resetCreateForm = () => {
  selectedWorkIds.value = [];
  expiresInDays.value = 7;
  selectedClientId.value = '';
  maxAccess.value = undefined;
};

const getShareUrl = (share: ShareInfo): string => {
  if (share.shareUrl) return share.shareUrl;
  // Album shares use different URL path
  if (share.albumId) {
    return `${window.location.origin}/album-share/${share.token}`;
  }
  return `${window.location.origin}/share/${share.token}`;
};

const copyShareUrl = async (share: ShareInfo) => {
  const url = getShareUrl(share);
  await navigator.clipboard.writeText(url);
  ElMessage.success('链接已复制！');
};

const revokeShare = async (token: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要撤销这个分享链接吗？',
      '撤销确认',
      { type: 'warning' }
    );
    await shareApi.revokeShare(token);
    ElMessage.success('撤销成功');
    await loadShares();
  } catch {
    // Cancelled
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
      <h2>分享管理</h2>
      <div class="filters">
        <el-select v-model="clientFilter" placeholder="全部客户" clearable style="width: 140px">
          <el-option
            v-for="client in clients"
            :key="client.id"
            :label="client.name"
            :value="client.id"
          />
        </el-select>
        <el-select v-model="typeFilter" placeholder="全部类型" clearable style="width: 120px">
          <el-option label="作品分享" value="work" />
          <el-option label="相册分享" value="album" />
        </el-select>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        创建分享链接
      </el-button>
    </div>
    
    <el-table :data="shares" v-loading="loading" stripe>
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.albumId ? 'success' : 'primary'">
            {{ row.albumId ? '相册' : '作品' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="名称" min-width="150">
        <template #default="{ row }">
          {{ row.albumName || `${row.workIds?.length || 0} 个作品` }}
        </template>
      </el-table-column>
      
      <el-table-column label="客户" width="120">
        <template #default="{ row }">
          {{ getClientName(row.clientId) }}
        </template>
      </el-table-column>
      
      <el-table-column label="访问次数" width="100" align="center">
        <template #default="{ row }">
          {{ row.accessCount || 0 }}
          <span v-if="row.maxAccess"> / {{ row.maxAccess }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      
      <el-table-column label="过期时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.expiresAt) }}
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="isExpired(row) ? 'danger' : 'success'">
            {{ isExpired(row) ? '已过期' : '有效' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="copyShareUrl(row)" :disabled="isExpired(row)">
            复制链接
          </el-button>
          <el-button link type="default" @click="loadAccessLogs(row.token)">
            访问记录
          </el-button>
          <el-button link type="danger" @click="revokeShare(row.token)" :disabled="isExpired(row)">
            撤销
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- Create dialog -->
    <el-dialog v-model="showCreateDialog" title="创建分享链接" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选择作品">
          <el-checkbox-group v-model="selectedWorkIds">
            <el-checkbox 
              v-for="work in works" 
              :key="work.id" 
              :value="work.id"
              :label="work.id"
            >
              {{ work.title }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="关联客户">
          <el-select v-model="selectedClientId" placeholder="不关联客户" clearable style="width: 100%">
            <el-option
              v-for="client in clients"
              :key="client.id"
              :label="client.name"
              :value="client.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="过期时间">
          <el-select v-model="expiresInDays" style="width: 100%">
            <el-option :value="1" label="1天" />
            <el-option :value="7" label="7天" />
            <el-option :value="30" label="30天" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="访问次数限制">
          <el-input-number 
            v-model="maxAccess" 
            :min="1" 
            placeholder="不限制"
            style="width: 100%"
          />
          <div class="form-hint">留空表示不限制访问次数</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="createShare" 
          :disabled="selectedWorkIds.length === 0"
        >
          创建并复制链接
        </el-button>
      </template>
    </el-dialog>
    
    <!-- Access Log Dialog -->
    <el-dialog v-model="showAccessLogDialog" title="访问记录" width="500px">
      <el-table :data="accessLogs" v-loading="accessLogsLoading" stripe>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="row.action === 'view' ? 'primary' : 'warning'" size="small">
              {{ row.action === 'view' ? '查看' : '下载' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP 地址" />
        <el-table-column label="时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <el-button @click="showAccessLogDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.shares-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>