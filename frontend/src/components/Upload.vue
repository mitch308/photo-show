<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload as UploadIcon } from '@element-plus/icons-vue';
import api from '@/api/index';
import type { UploadResult } from '@/api/types';

const props = defineProps<{
  accept?: 'image' | 'video' | 'all';
}>();

const emit = defineEmits<{
  success: [result: UploadResult];
  error: [error: Error];
}>();

const uploading = ref(false);
const uploadProgress = ref(0);
const dragover = ref(false);

const acceptTypes = computed(() => {
  if (props.accept === 'image') return 'image/jpeg,image/png,image/webp';
  if (props.accept === 'video') return 'video/mp4,video/webm,video/quicktime,video/x-msvideo';
  return 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo';
});

async function handleUpload(file: File) {
  uploading.value = true;
  uploadProgress.value = 0;

  const formData = new FormData();
  formData.append('file', file);

  const isVideo = file.type.startsWith('video/');
  const endpoint = isVideo ? '/upload/video' : '/upload/image';

  try {
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          uploadProgress.value = Math.round((e.loaded * 100) / e.total);
        }
      },
    });

    const result: UploadResult = response.data.data;
    emit('success', result);
    ElMessage.success('上传成功');
  } catch (error: any) {
    emit('error', error);
    ElMessage.error(error.message || '上传失败');
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
}

function handleDrop(e: DragEvent) {
  dragover.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleUpload(files[0]);
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleUpload(files[0]);
  }
}
</script>

<template>
  <div
    class="upload-area"
    :class="{ dragover, uploading }"
    @dragover.prevent="dragover = true"
    @dragleave.prevent="dragover = false"
    @drop.prevent="handleDrop"
  >
    <template v-if="!uploading">
      <input
        type="file"
        :accept="acceptTypes"
        @change="handleFileChange"
        class="file-input"
      />
      <div class="upload-hint">
        <el-icon size="48"><UploadIcon /></el-icon>
        <p>拖拽文件到此处或点击上传</p>
        <p class="hint-text">支持 JPG、PNG、WebP 图片，MP4、WebM 视频</p>
        <p class="hint-text">最大 50MB</p>
      </div>
    </template>
    <template v-else>
      <div class="upload-progress">
        <el-progress type="circle" :percentage="uploadProgress" />
        <p>上传中...</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-area.dragover {
  border-color: #409eff;
  background: #f0f7ff;
}

.upload-area.uploading {
  pointer-events: none;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-hint {
  color: #909399;
}

.upload-hint p {
  margin: 8px 0;
}

.hint-text {
  font-size: 12px;
  color: #c0c4cc;
}

.upload-progress {
  padding: 20px;
}
</style>