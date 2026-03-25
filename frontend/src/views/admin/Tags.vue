<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { tagsApi } from '@/api/tags';
import type { Tag } from '@/api/types';

const tags = ref<Tag[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const editingTag = ref<Tag | null>(null);
const form = ref({ name: '' });

onMounted(() => loadTags());

async function loadTags() {
  loading.value = true;
  try {
    tags.value = await tagsApi.getTags();
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  editingTag.value = null;
  form.value = { name: '' };
  dialogVisible.value = true;
}

function openEditDialog(tag: Tag) {
  editingTag.value = tag;
  form.value = { name: tag.name };
  dialogVisible.value = true;
}

async function saveTag() {
  try {
    if (editingTag.value) {
      await tagsApi.updateTag(editingTag.value.id, form.value.name);
      ElMessage.success('更新成功');
    } else {
      await tagsApi.createTag(form.value.name);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadTags();
  } catch (error: any) {
    ElMessage.error(error.message);
  }
}

async function deleteTag(tag: Tag) {
  try {
    await ElMessageBox.confirm(`确定要删除标签「${tag.name}」吗？`, '删除确认', { type: 'warning' });
    await tagsApi.deleteTag(tag.id);
    ElMessage.success('删除成功');
    loadTags();
  } catch {
    // Cancelled
  }
}
</script>

<template>
  <div class="tags-page">
    <div class="page-header">
      <h2>标签管理</h2>
      <el-button type="primary" @click="openCreateDialog">新建标签</el-button>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingTag ? '编辑标签' : '新建标签'" width="400px">
      <el-form :model="form" label-width="60px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTag" :disabled="!form.name">保存</el-button>
      </template>
    </el-dialog>

    <el-table :data="tags" v-loading="loading" stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column label="作品数" width="100">
        <template #default="{ row }">
          {{ row.works?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="deleteTag(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.tags-page {
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