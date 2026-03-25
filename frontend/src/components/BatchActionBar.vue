<script setup lang="ts">
import { computed } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import {
  Check,
  Close,
  FolderOpened,
  Delete,
  CloseBold,
} from '@element-plus/icons-vue';

const props = defineProps<{
  selectedCount: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  batchPublic: [];
  batchPrivate: [];
  batchMove: [];
  batchDelete: [];
  clearSelection: [];
}>();

const hasSelection = computed(() => props.selectedCount > 0);

async function handleBatchPublic() {
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${props.selectedCount} 个作品设为公开吗？`,
      '批量公开',
      { type: 'info' }
    );
    emit('batchPublic');
  } catch {
    // Cancelled
  }
}

async function handleBatchPrivate() {
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${props.selectedCount} 个作品设为私密吗？`,
      '批量私密',
      { type: 'info' }
    );
    emit('batchPrivate');
  } catch {
    // Cancelled
  }
}

function handleBatchMove() {
  emit('batchMove');
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${props.selectedCount} 个作品吗？此操作不可恢复。`,
      '批量删除',
      { type: 'warning' }
    );
    emit('batchDelete');
  } catch {
    // Cancelled
  }
}

function handleClearSelection() {
  emit('clearSelection');
}
</script>

<template>
  <Transition name="slide-up">
    <div v-if="hasSelection" class="batch-action-bar">
      <div class="selection-info">
        <span class="count">已选择 {{ selectedCount }} 个作品</span>
        <el-button link type="info" @click="handleClearSelection">
          <el-icon><CloseBold /></el-icon>
          取消选择
        </el-button>
      </div>

      <div class="action-buttons">
        <el-button
          type="success"
          :icon="Check"
          :loading="loading"
          @click="handleBatchPublic"
        >
          批量公开
        </el-button>
        <el-button
          type="warning"
          :icon="Close"
          :loading="loading"
          @click="handleBatchPrivate"
        >
          批量私密
        </el-button>
        <el-button
          type="primary"
          :icon="FolderOpened"
          :loading="loading"
          @click="handleBatchMove"
        >
          移动到相册
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :loading="loading"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.batch-action-bar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-lg);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 100;
  min-width: 500px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>