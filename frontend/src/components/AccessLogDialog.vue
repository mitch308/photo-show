<script setup lang="ts">
import { ref, watch } from 'vue';
import { shareApi, type AccessLogEntry } from '@/api/share';

/**
 * Access Log Dialog Component
 * Per PRIV-05: 管理员可以查看私密链接的访问记录
 */

const props = defineProps<{
  visible: boolean;
  token: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}>();

const logs = ref<AccessLogEntry[]>([]);
const loading = ref(false);

// Load logs when dialog opens with a valid token
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.token) {
      await loadLogs();
    }
  }
);

const loadLogs = async () => {
  loading.value = true;
  logs.value = [];
  
  try {
    const result = await shareApi.getAccessLogs(props.token);
    logs.value = result.logs;
  } catch (e) {
    console.error('Failed to load access logs:', e);
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('zh-CN');
};

const close = () => {
  emit('update:visible', false);
  emit('close');
};
</script>

<template>
  <div v-if="visible" class="dialog-overlay" @click.self="close">
    <div class="dialog">
      <h2>访问记录</h2>
      
      <div v-if="loading" class="loading">加载中...</div>
      
      <table v-else-if="logs.length > 0" class="log-table">
        <thead>
          <tr>
            <th>操作类型</th>
            <th>IP 地址</th>
            <th>User Agent</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>
              <span :class="['action-tag', log.action]">
                {{ log.action === 'view' ? '查看' : '下载' }}
              </span>
            </td>
            <td>{{ log.ipAddress }}</td>
            <td class="user-agent">{{ log.userAgent }}</td>
            <td>{{ formatDate(log.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="empty">暂无访问记录</div>
      
      <div class="dialog-actions">
        <button class="btn-primary" @click="close">关闭</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: 8px;
  overflow: hidden;
  font-size: 14px;
}

.log-table th,
.log-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.action-tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.action-tag.view {
  background: #cce5ff;
  color: #004085;
}

.action-tag.download {
  background: #fff3cd;
  color: #856404;
}

.user-agent {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--text-secondary);
}

.empty, .loading {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-primary {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>