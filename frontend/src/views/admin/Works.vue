<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useWorksStore } from '@/stores/works';
import { albumsApi } from '@/api/albums';
import { tagsApi } from '@/api/tags';
import Upload from '@/components/Upload.vue';
import type { Album, Tag, UploadResult, Work } from '@/api/types';

const worksStore = useWorksStore();
const albums = ref<Album[]>([]);
const tags = ref<Tag[]>([]);

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

onMounted(async () => {
  await Promise.all([
    worksStore.fetchWorks(),
    loadAlbums(),
    loadTags(),
  ]);
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
  dialogVisible.value = true;
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
</script>

<template>
  <div class="works-page">
    <div class="page-header">
      <h2>作品管理</h2>
      <el-button type="primary" @click="dialogVisible = true">
        上传作品
      </el-button>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingWork ? '编辑作品' : '上传作品'"
      width="600px"
      @closed="resetForm"
    >
      <div v-if="!editingWork && !uploadedFile">
        <Upload @success="handleUploadSuccess" />
      </div>
      
      <el-form v-else :model="form" label-width="80px">
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
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWork" :disabled="!form.title">
          {{ editingWork ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <el-table :data="worksStore.works" v-loading="worksStore.loading" stripe>
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
      
      <el-table-column label="大小" width="100">
        <template #default="{ row }">
          {{ formatFileSize(row.fileSize) }}
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
  </div>
</template>

<style scoped>
.works-page {
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
</style>