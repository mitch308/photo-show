<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
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
    ElMessage.success('创建成功');
    showCreateDialog.value = false;
  } catch (e: any) {
    ElMessage.error('创建失败：' + e.message);
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
    ElMessage.success('更新成功');
    showEditDialog.value = false;
    editingClient.value = null;
  } catch (e: any) {
    ElMessage.error('更新失败：' + e.message);
  }
};

const deleteClient = async (client: Client) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除客户"${client.name}"吗？`,
      '删除确认',
      { type: 'warning' }
    );
    await clientsStore.deleteClient(client.id);
    ElMessage.success('删除成功');
    if (selectedClient.value?.id === client.id) {
      showDetailDialog.value = false;
    }
  } catch {
    // Cancelled
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
  ElMessage.success('链接已复制！');
};

const clients = computed(() => clientsStore.clients);
const loading = computed(() => clientsStore.loading);
</script>

<template>
  <div class="clients-page">
    <div class="page-header">
      <h2>客户管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索客户..."
          clearable
          style="width: 200px"
        />
        <el-button type="primary" @click="openCreateDialog">
          添加客户
        </el-button>
      </div>
    </div>
    
    <el-table :data="clients" v-loading="loading" stripe>
      <el-table-column prop="name" label="姓名" min-width="100" />
      <el-table-column label="电话" width="130">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="邮箱" min-width="150">
        <template #default="{ row }">
          {{ row.email || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="公司" min-width="120">
        <template #default="{ row }">
          {{ row.company || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="分享数" width="80" align="center">
        <template #default="{ row }">
          {{ row.shareCount }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetailDialog(row)">详情</el-button>
          <el-button link type="default" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteClient(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- Create Dialog -->
    <el-dialog v-model="showCreateDialog" title="添加客户" width="500px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="电话">
          <el-input v-model="formData.phone" placeholder="请输入电话" />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="公司">
          <el-input v-model="formData.company" placeholder="请输入公司" />
        </el-form-item>
        
        <el-form-item label="地址">
          <el-input v-model="formData.address" placeholder="请输入地址" />
        </el-form-item>
        
        <el-form-item label="生日">
          <el-date-picker
            v-model="formData.birthday"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="formData.notes" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createClient" :disabled="!formData.name">
          创建
        </el-button>
      </template>
    </el-dialog>
    
    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑客户" width="500px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="电话">
          <el-input v-model="formData.phone" placeholder="请输入电话" />
        </el-form-item>
        
        <el-form-item label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="公司">
          <el-input v-model="formData.company" placeholder="请输入公司" />
        </el-form-item>
        
        <el-form-item label="地址">
          <el-input v-model="formData.address" placeholder="请输入地址" />
        </el-form-item>
        
        <el-form-item label="生日">
          <el-date-picker
            v-model="formData.birthday"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input v-model="formData.notes" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateClient" :disabled="!formData.name">
          保存
        </el-button>
      </template>
    </el-dialog>
    
    <!-- Detail Dialog -->
    <el-dialog 
      v-model="showDetailDialog" 
      title="客户详情" 
      width="700px"
    >
      <el-descriptions :column="2" border v-if="selectedClient">
        <el-descriptions-item label="姓名">{{ selectedClient.name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ selectedClient.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ selectedClient.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公司">{{ selectedClient.company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ selectedClient.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生日">{{ selectedClient.birthday ? formatDate(selectedClient.birthday) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ selectedClient.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <h3 style="margin-top: 20px; margin-bottom: 10px;">分享链接</h3>
      <el-table :data="clientShares" stripe size="small">
        <el-table-column label="作品数" width="80" align="center">
          <template #default="{ row }">
            {{ row.workIds.length }}
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.expiresAt) }}
          </template>
        </el-table-column>
        <el-table-column label="访问次数" width="100" align="center">
          <template #default="{ row }">
            {{ row.accessCount || 0 }} / {{ row.maxAccess || '无限' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="isShareExpired(row) ? 'danger' : 'success'" size="small">
              {{ isShareExpired(row) ? '已过期' : '有效' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="copyShareUrl(row.token)" :disabled="isShareExpired(row)">
              复制链接
            </el-button>
            <el-button link type="default" size="small" @click="loadAccessLogs(row)">
              访问记录
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="clientShares.length === 0" description="暂无分享链接" :image-size="60" />
      
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
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
.clients-page {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>