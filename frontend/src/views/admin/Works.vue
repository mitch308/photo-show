<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useWorksStore } from '@/stores/works';
import { albumsApi } from '@/api/albums';
import { tagsApi } from '@/api/tags';
import { batchApi } from '@/api/batch';
import { mediaItemsApi } from '@/api/mediaItems';
import Upload from '@/components/Upload.vue';
import BatchActionBar from '@/components/BatchActionBar.vue';
import type { Album, Tag, UploadResult, Work, MediaItem } from '@/api/types';

const worksStore = useWorksStore();
const albums = ref<Album[]>([]);
const tags = ref<Tag[]>([]);

// Filter state
const searchQuery = ref('');
const statusFilter = ref('');

const dialogVisible = ref(false);
const editingWork = ref<Work | null>(null);
const form = ref({
  title: '',
  description: '',
  isPublic: true,
  isPinned: false,
  albumIds: [] as string[],
  tagIds: [] as string[],
});

const uploadedFile = ref<UploadResult | null>(null);

// File management state
const addingFile = ref(false);

// Batch selection state
const selectedWorks = ref<string[]>([]);
const batchLoading = ref(false);
const moveDialogVisible = ref(false);
const selectedAlbumIds = ref<string[]>([]);

onMounted(async () => {
  await Promise.all([
    worksStore.fetchWorks(),
    loadAlbums(),
    loadTags(),
  ]);
});

// Filter with debounce
let searchTimeout: ReturnType<typeof setTimeout>;
watch([searchQuery, statusFilter], () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const filters: { title?: string; isPublic?: boolean; isPinned?: boolean } = {};
    if (searchQuery.value) filters.title = searchQuery.value;
    if (statusFilter.value === 'public') filters.isPublic = true;
    if (statusFilter.value === 'private') filters.isPublic = false;
    if (statusFilter.value === 'pinned') filters.isPinned = true;
    worksStore.fetchWorks(filters);
  }, 300);
});

async function loadAlbums() {
  albums.value = await albumsApi.getAlbums();
}

async function loadTags() {
  tags.value = await tagsApi.getTags();
}

function handleUploadSuccess(result: UploadResult) {
  uploadedFile.value = result;
  form.value.title = result.originalFilename.replace(/\.[^/.]+$/, '');
  // Don't set dialogVisible.value = true; dialog is already open
}

function openEditDialog(work: Work) {
  if (!work.id) {
    ElMessage.error('作品ID不存在，请刷新页面重试');
    console.error('Work missing id:', work);
    return;
  }
  editingWork.value = work;
  uploadedFile.value = null;
  form.value = {
    title: work.title,
    description: work.description,
    isPublic: work.isPublic,
    isPinned: work.isPinned,
    albumIds: (work.albums || []).map(a => a.id),
    tagIds: (work.tags || []).map(t => t.id),
  };
  dialogVisible.value = true;
}

async function saveWork() {
  try {
    if (editingWork.value) {
      await worksStore.updateWork(editingWork.value.id, form.value);
      ElMessage.success('更新成功');
    } else if (uploadedFile.value) {
      await worksStore.createWork({
        ...form.value,
        ...uploadedFile.value,
        albumIds: form.value.albumIds,
        tagIds: form.value.tagIds,
      });
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    resetForm();
  } catch (error: any) {
    ElMessage.error(error.message);
  }
}

async function deleteWork(work: Work) {
  try {
    await ElMessageBox.confirm(
      `确定要删除作品「${work.title}」吗？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' }
    );
    await worksStore.deleteWork(work.id);
    ElMessage.success('删除成功');
  } catch {
    // Cancelled
  }
}

async function handleAddFile(result: UploadResult & { isDuplicate?: boolean }) {
  if (!editingWork.value) return;

  addingFile.value = true;
  try {
    const data = {
      filePath: result.filePath,
      thumbnailSmall: result.thumbnailSmall || null,
      thumbnailLarge: result.thumbnailLarge || null,
      originalFilename: result.originalFilename,
      fileType: result.fileType,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      fileHash: result.fileHash || undefined,
    };

    await mediaItemsApi.addMediaItem(editingWork.value.id, data);

    ElMessage.success('文件添加成功');

    await worksStore.fetchWorks();

    const updated = worksStore.works.find(w => w.id === editingWork.value?.id);
    if (updated) {
      editingWork.value = updated;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败');
  } finally {
    addingFile.value = false;
  }
}

async function handleDeleteFile(item: MediaItem) {
  if (!editingWork.value) return;
  
  if (editingWork.value.mediaItems && editingWork.value.mediaItems.length <= 1) {
    ElMessage.warning('作品至少需要保留一个文件，请先上传其他文件');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除文件「${item.originalFilename}」吗？此操作不可恢复。`,
      '删除确认',
      { type: 'warning' }
    );
    
    await mediaItemsApi.deleteMediaItem(item.id);
    ElMessage.success('文件删除成功');
    
    await worksStore.fetchWorks();
    
    const updated = worksStore.works.find(w => w.id === editingWork.value?.id);
    if (updated) {
      editingWork.value = updated;
    }
  } catch {
    // 用户取消
  }
}

function resetForm() {
  editingWork.value = null;
  uploadedFile.value = null;
  form.value = {
    title: '',
    description: '',
    isPublic: true,
    isPinned: false,
    albumIds: [],
    tagIds: [],
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileCount(work: Work): number {
  return work.mediaItems?.length || 1;
}

function getTotalFileSize(work: Work): number {
  if (work.mediaItems && work.mediaItems.length > 0) {
    return work.mediaItems.reduce((sum, item) => sum + item.fileSize, 0);
  }
  return work.fileSize || 0;
}

// Batch selection handlers
function handleSelectionChange(selection: Work[]) {
  selectedWorks.value = selection.map(w => w.id);
}

function clearSelection() {
  selectedWorks.value = [];
}

// Batch operations
async function handleBatchPublic() {
  batchLoading.value = true;
  try {
    const result = await batchApi.updateStatus(selectedWorks.value, true);
    ElMessage.success(`成功将 ${result.success.length} 个作品设为公开`);
    await worksStore.fetchWorks();
    clearSelection();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    batchLoading.value = false;
  }
}

async function handleBatchPrivate() {
  batchLoading.value = true;
  try {
    const result = await batchApi.updateStatus(selectedWorks.value, false);
    ElMessage.success(`成功将 ${result.success.length} 个作品设为私密`);
    await worksStore.fetchWorks();
    clearSelection();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    batchLoading.value = false;
  }
}

function openMoveDialog() {
  selectedAlbumIds.value = [];
  moveDialogVisible.value = true;
}

async function handleBatchMove() {
  if (selectedAlbumIds.value.length === 0) {
    ElMessage.warning('请选择至少一个相册');
    return;
  }

  batchLoading.value = true;
  try {
    const result = await batchApi.moveToAlbum(selectedWorks.value, selectedAlbumIds.value, 'set');
    ElMessage.success(`成功将 ${result.success.length} 个作品移动到相册`);
    await worksStore.fetchWorks();
    moveDialogVisible.value = false;
    clearSelection();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    batchLoading.value = false;
  }
}

async function handleBatchDelete() {
  batchLoading.value = true;
  try {
    const result = await batchApi.deleteWorks(selectedWorks.value);
    ElMessage.success(`成功删除 ${result.success.length} 个作品`);
    await worksStore.fetchWorks();
    clearSelection();
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    batchLoading.value = false;
  }
}
</script>

<template>
  <div class="works-page">
    <div class="page-header">
      <h2>作品管理</h2>
      <div class="filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索作品标题..."
          clearable
          style="width: 200px"
        />
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 120px">
          <el-option label="公开" value="public" />
          <el-option label="私密" value="private" />
          <el-option label="置顶" value="pinned" />
        </el-select>
      </div>
      <el-button type="primary" @click="dialogVisible = true">
        上传作品
      </el-button>
    </div>

    <!-- Upload/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingWork ? '编辑作品' : '上传作品'"
      width="600px"
      @closed="resetForm"
    >
      <el-form :model="form" label-width="80px">
        <!-- Form fields first -->
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="相册">
          <el-select v-model="form.albumIds" multiple placeholder="选择相册">
            <el-option
              v-for="album in albums"
              :key="album.id"
              :label="album.name"
              :value="album.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select v-model="form.tagIds" multiple placeholder="选择标签">
            <el-option
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="置顶">
          <el-switch v-model="form.isPinned" />
        </el-form-item>

        <el-form-item label="公开">
          <el-switch v-model="form.isPublic" />
        </el-form-item>

        <!-- File management area (edit mode) -->
        <el-form-item v-if="editingWork" label="文件">
          <div class="files-manager">
            <div class="files-list">
              <div
                v-for="item in editingWork.mediaItems"
                :key="item.id"
                class="file-item"
              >
                <el-image
                  v-if="item.thumbnailSmall"
                  :src="`/${item.thumbnailSmall}`"
                  fit="cover"
                  class="file-thumb"
                />
                <div v-else class="file-thumb file-thumb-placeholder">
                  {{ item.fileType === 'video' ? '🎬' : '📷' }}
                </div>
                <span class="file-name">{{ item.originalFilename }}</span>
                <el-button
                  link
                  type="danger"
                  size="small"
                  :disabled="editingWork.mediaItems && editingWork.mediaItems.length <= 1"
                  @click="handleDeleteFile(item)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- Upload area at bottom - always visible -->
        <div class="upload-section">
          <div v-if="editingWork" class="upload-label">添加更多文件：</div>
          <div v-else class="upload-label">上传文件：</div>
          <Upload
            @success="editingWork ? handleAddFile($event) : handleUploadSuccess($event)"
          />
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWork" :disabled="!form.title">
          {{ editingWork ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Move Dialog -->
    <el-dialog
      v-model="moveDialogVisible"
      title="移动到相册"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="目标相册">
          <el-select v-model="selectedAlbumIds" multiple placeholder="选择相册">
            <el-option
              v-for="album in albums"
              :key="album.id"
              :label="album.name"
              :value="album.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchMove" :loading="batchLoading">
          确定移动
        </el-button>
      </template>
    </el-dialog>

    <!-- Works Table -->
    <el-table
      :data="worksStore.works"
      v-loading="worksStore.loading"
      stripe
      @selection-change="handleSelectionChange"
    >
      <!-- Checkbox column for batch selection -->
      <el-table-column type="selection" width="55" />
      
      <el-table-column width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.thumbnailSmall"
            :src="`/${row.thumbnailSmall}`"
            fit="cover"
            style="width: 60px; height: 60px"
          />
        </template>
      </el-table-column>
      
      <el-table-column prop="title" label="标题" min-width="150" />
      
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.fileType === 'image' ? 'primary' : 'success'">
            {{ row.fileType === 'image' ? '图片' : '视频' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="文件" width="70" align="center">
        <template #default="{ row }">
          <span>{{ getFileCount(row) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="大小" width="100">
        <template #default="{ row }">
          {{ formatFileSize(getTotalFileSize(row)) }}
        </template>
      </el-table-column>
      
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.isPinned" type="warning">置顶</el-tag>
          <el-tag :type="row.isPublic ? 'success' : 'info'">
            {{ row.isPublic ? '公开' : '私密' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- Statistics columns per STAT-04 -->
      <el-table-column label="浏览" width="80" align="right">
        <template #default="{ row }">
          <span class="stat-count">{{ row.viewCount || 0 }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="下载" width="80" align="right">
        <template #default="{ row }">
          <span class="stat-count">{{ row.downloadCount || 0 }}</span>
        </template>
      </el-table-column>
      
      <el-table-column label="相册" min-width="150">
        <template #default="{ row }">
          <el-tag
            v-for="album in row.albums"
            :key="album.id"
            size="small"
            style="margin-right: 4px"
          >
            {{ album.name }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteWork(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Batch Action Bar -->
    <BatchActionBar
      :selected-count="selectedWorks.length"
      :loading="batchLoading"
      @batch-public="handleBatchPublic"
      @batch-private="handleBatchPrivate"
      @batch-move="openMoveDialog"
      @batch-delete="handleBatchDelete"
      @clear-selection="clearSelection"
    />
  </div>
</template>

<style scoped>
.works-page {
  padding: 20px;
  padding-bottom: 100px;
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

.stat-count {
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-regular);
}

.files-manager {
  width: 100%;
}

.files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  min-width: 200px;
  max-width: 300px;
}

.file-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
}

.file-thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color);
  font-size: 18px;
}

.file-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.upload-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.upload-label {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.add-file-area {
  margin-top: 10px;
}
</style>