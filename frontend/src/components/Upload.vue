<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Upload as UploadIcon, Loading } from '@element-plus/icons-vue';
import api from '@/api/index';
import { mediaItemsApi } from '@/api/mediaItems';
import { computeFastMd5 } from '@/utils/hash';
import type { UploadResult, MediaItem } from '@/api/types';

const props = defineProps<{
  accept?: 'image' | 'video' | 'all';
}>();

const emit = defineEmits<{
  success: [result: UploadResult & { isDuplicate?: boolean }];
  error: [error: Error];
}>();

const computingHash = ref(false);
const hashProgress = ref(0);
const checkingHash = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const dragover = ref(false);

const acceptTypes = computed(() => {
  if (props.accept === 'image') return 'image/jpeg,image/png,image/webp';
  if (props.accept === 'video') return 'video/mp4,video/webm,video/quicktime,video/x-msvideo';
  return 'image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,video/x-msvideo';
});

async function handleUpload(file: File) {
  // Step 1: 计算 Fast-MD5
  computingHash.value = true;
  hashProgress.value = 0;
  
  try {
    const hash = await computeFastMd5(file, (p) => {
      hashProgress.value = p;
    });
    computingHash.value = false;
    
    // Step 2: 预检查
    checkingHash.value = true;
    const checkResult = await mediaItemsApi.checkFileHash(hash);
    checkingHash.value = false;
    
    if (checkResult.exists && checkResult.mediaItem) {
      // 文件已存在，跳过上传
      const existingItem = checkResult.mediaItem as MediaItem;
      emit('success', {
        filePath: existingItem.filePath,
        thumbnailSmall: existingItem.thumbnailSmall || null,
        thumbnailLarge: existingItem.thumbnailLarge || null,
        originalFilename: existingItem.originalFilename,
        fileType: existingItem.fileType,
        mimeType: existingItem.mimeType,
        fileSize: existingItem.fileSize,
        fileHash: existingItem.fileHash,
        isDuplicate: true,
      });
      ElMessage.success('文件已存在，已跳过上传');
      return;
    }
    
    // Step 3: 上传新文件
    uploading.value = true;
    uploadProgress.value = 0;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileHash', hash);
    
    const isVideo = file.type.startsWith('video/');
    const endpoint = isVideo ? '/upload/video' : '/upload/image';
    
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
    computingHash.value = false;
    checkingHash.value = false;
    uploading.value = false;
    uploadProgress.value = 0;
    hashProgress.value = 0;
  }
}

function handleDrop(e: DragEvent) {
  dragover.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    // Process all files sequentially
    Array.from(files).forEach(file => handleUpload(file));
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    // Process all files sequentially
    Array.from(files).forEach(file => handleUpload(file));
  }
}
</script>

<template>
  <div
    class="upload-area"
    :class="{ dragover, uploading: computingHash || checkingHash || uploading }"
    @dragover.prevent="dragover = true"
    @dragleave.prevent="dragover = false"
    @drop.prevent="handleDrop"
  >
    <template v-if="!computingHash && !checkingHash && !uploading">
      <input
        type="file"
        :accept="acceptTypes"
        multiple
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
    <template v-else-if="computingHash">
      <div class="upload-progress">
        <el-progress type="circle" :percentage="hashProgress" />
        <p>计算文件哈希...</p>
      </div>
    </template>
    <template v-else-if="checkingHash">
      <div class="upload-progress">
        <el-icon class="is-loading" size="48"><Loading /></el-icon>
        <p>检查文件...</p>
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

.upload-progress .is-loading {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>