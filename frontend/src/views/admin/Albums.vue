<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { albumsApi } from '@/api/albums';
import { shareApi } from '@/api/share';
import { useClientsStore } from '@/stores/clients';
import type { Album } from '@/api/types';

const albums = ref<Album[]>([]);
const loading = ref(false);

// Search state
const searchQuery = ref('');

const dialogVisible = ref(false);
const editingAlbum = ref<Album | null>(null);
const form = ref({ name: '', description: '' });

// Share dialog state
const shareDialogVisible = ref(false);
const sharingAlbum = ref<Album | null>(null);
const shareForm = ref({
  expiresInDays: 7,
  maxAccess: undefined as number | undefined,
  clientId: '',
});
const generatedShareUrl = ref('');
const shareLoading = ref(false);

const clientsStore = useClientsStore();

onMounted(() => {
  loadAlbums();
  clientsStore.fetchClients();
});

// Search with debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    loadAlbums(searchQuery.value || undefined);
  }, 300);
});

async function loadAlbums(name?: string) {
  loading.value = true;
  try {
    albums.value = await albumsApi.getAlbums(name);
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editingAlbum.value = null;
  form.value = { name: '', description: '' };
  dialogVisible.value = true;
}

function openEditDialog(album: Album) {
  editingAlbum.value = album;
  form.value = { name: album.name, description: album.description };
  dialogVisible.value = true;
}

async function saveAlbum() {
  try {
    if (editingAlbum.value) {
      await albumsApi.updateAlbum(editingAlbum.value.id, form.value);
      ElMessage.success('更新成功');
    } else {
      await albumsApi.createAlbum(form.value);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadAlbums();
  } catch (error: any) {
    ElMessage.error(error.message);
  }
}

async function deleteAlbum(album: Album) {
  try {
    await ElMessageBox.confirm(
      '删除相册时，是否同时删除其中的作品？',
      '删除相册',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: '删除相册和作品',
        cancelButtonText: '仅删除相册',
        type: 'warning',
      }
    );
    await albumsApi.deleteAlbum(album.id, true);
    ElMessage.success('删除成功');
    loadAlbums();
  } catch (action: any) {
    if (action === 'cancel') {
      await albumsApi.deleteAlbum(album.id, false);
      ElMessage.success('删除成功');
      loadAlbums();
    }
  }
}

// Share functions
function openShareDialog(album: Album) {
  sharingAlbum.value = album;
  shareForm.value = { expiresInDays: 7, maxAccess: undefined, clientId: '' };
  generatedShareUrl.value = '';
  shareDialogVisible.value = true;
}

async function createAlbumShare() {
  if (!sharingAlbum.value) return;
  
  shareLoading.value = true;
  try {
    const result = await shareApi.createAlbumShare({
      albumId: sharingAlbum.value.id,
      expiresInDays: shareForm.value.expiresInDays,
      maxAccess: shareForm.value.maxAccess,
      clientId: shareForm.value.clientId || undefined,
    });
    
    generatedShareUrl.value = result.shareUrl || '';
    await navigator.clipboard.writeText(generatedShareUrl.value);
    ElMessage.success('分享链接已创建并复制到剪贴板');
  } catch (error: any) {
    ElMessage.error('创建分享链接失败：' + error.message);
  } finally {
    shareLoading.value = false;
  }
}

async function copyShareUrl() {
  if (generatedShareUrl.value) {
    await navigator.clipboard.writeText(generatedShareUrl.value);
    ElMessage.success('链接已复制');
  }
}

const clients = computed(() => clientsStore.clients);
</script>

<template>
  <div class="albums-page">
    <div class="page-header">
      <h2>相册管理</h2>
      <el-input
        v-model="searchQuery"
        placeholder="搜索相册名称..."
        clearable
        style="width: 200px; margin-right: 12px"
      />
      <el-button type="primary" @click="openCreateDialog">新建相册</el-button>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingAlbum ? '编辑相册' : '新建相册'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入相册名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAlbum" :disabled="!form.name">保存</el-button>
      </template>
    </el-dialog>

    <!-- Share Dialog -->
    <el-dialog v-model="shareDialogVisible" title="分享相册" width="500px">
      <div v-if="sharingAlbum">
        <p class="share-album-name">
          相册：<strong>{{ sharingAlbum.name }}</strong>
          <span class="work-count">（{{ sharingAlbum.works?.length || 0 }} 个作品）</span>
        </p>
        
        <el-form label-width="100px" class="share-form">
          <el-form-item label="过期时间">
            <el-select v-model="shareForm.expiresInDays">
              <el-option :value="1" label="1 天" />
              <el-option :value="7" label="7 天" />
              <el-option :value="30" label="30 天" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="关联客户">
            <el-select v-model="shareForm.clientId" placeholder="不关联客户" clearable>
              <el-option
                v-for="client in clients"
                :key="client.id"
                :value="client.id"
                :label="client.name"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="访问限制">
            <el-input-number
              v-model="shareForm.maxAccess"
              :min="1"
              placeholder="不限制"
              controls-position="right"
            />
            <span class="form-hint">留空表示不限制访问次数</span>
          </el-form-item>
        </el-form>
        
        <div v-if="generatedShareUrl" class="share-result">
          <p>分享链接：</p>
          <div class="share-url-box">
            <input type="text" :value="generatedShareUrl" readonly class="share-url-input" />
            <el-button type="primary" @click="copyShareUrl">复制</el-button>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="shareDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="createAlbumShare"
          :loading="shareLoading"
          :disabled="!!generatedShareUrl"
        >
          {{ generatedShareUrl ? '已创建' : '创建并复制链接' }}
        </el-button>
      </template>
    </el-dialog>

    <el-table :data="albums" v-loading="loading" stripe>
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="作品数" width="100">
        <template #default="{ row }">
          {{ row.works?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="success" @click="openShareDialog(row)">分享</el-button>
          <el-button link type="danger" @click="deleteAlbum(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.albums-page {
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

.share-album-name {
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.work-count {
  font-size: 13px;
}

.share-form {
  margin-bottom: 16px;
}

.form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.share-result {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.share-url-box {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.share-url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-primary);
  font-size: 13px;
}
</style>