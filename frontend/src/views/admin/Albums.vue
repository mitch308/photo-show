<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { albumsApi } from '@/api/albums';
import type { Album } from '@/api/types';

const albums = ref<Album[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const editingAlbum = ref<Album | null>(null);
const form = ref({ name: '', description: '' });

onMounted(() => loadAlbums());

async function loadAlbums() {
  loading.value = true;
  try {
    albums.value = await albumsApi.getAlbums();
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
</script>

<template>
  <div class="albums-page">
    <div class="page-header">
      <h2>相册管理</h2>
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

    <el-table :data="albums" v-loading="loading" stripe>
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column label="作品数" width="100">
        <template #default="{ row }">
          {{ row.works?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
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
</style>