<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { settingsApi } from '@/api/settings';
import type { WatermarkConfig } from '@/types/settings';

const loading = ref(false);
const saving = ref(false);

const form = ref<WatermarkConfig>({
  enabled: false,
  type: 'text',
  text: '',
  position: 'bottom-right',
  opacity: 0.5,
});

const positionOptions = [
  { label: '左上角', value: 'top-left' },
  { label: '右上角', value: 'top-right' },
  { label: '左下角', value: 'bottom-left' },
  { label: '右下角', value: 'bottom-right' },
  { label: '居中', value: 'center' },
];

const uploadRef = ref();
const uploading = ref(false);

onMounted(async () => {
  await loadConfig();
});

async function loadConfig() {
  loading.value = true;
  try {
    const config = await settingsApi.getWatermarkConfig();
    form.value = config;
  } catch (error: any) {
    ElMessage.error(error.message || '加载配置失败');
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  // Validation
  if (form.value.enabled) {
    if (form.value.type === 'text' && !form.value.text) {
      ElMessage.warning('请输入水印文字');
      return;
    }
    if (form.value.type === 'image' && !form.value.imagePath) {
      ElMessage.warning('请上传水印图片');
      return;
    }
  }

  saving.value = true;
  try {
    await settingsApi.setWatermarkConfig(form.value);
    ElMessage.success('配置已保存');
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleImageUpload(options: any) {
  uploading.value = true;
  try {
    const result = await settingsApi.uploadWatermarkImage(options.file);
    form.value.imagePath = result.imagePath;
    ElMessage.success('水印图片上传成功');
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败');
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="settings-page" v-loading="loading">
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>水印设置</span>
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
        </div>
      </template>

      <el-form :model="form" label-width="100px" :disabled="!form.enabled">
        <el-form-item label="水印类型">
          <el-radio-group v-model="form.type">
            <el-radio value="text">文字水印</el-radio>
            <el-radio value="image">图片水印</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Text watermark -->
        <el-form-item v-if="form.type === 'text'" label="水印文字">
          <el-input
            v-model="form.text"
            placeholder="请输入水印文字"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <!-- Image watermark -->
        <el-form-item v-if="form.type === 'image'" label="水印图片">
          <div class="image-upload-area">
            <el-upload
              ref="uploadRef"
              :show-file-list="false"
              :http-request="handleImageUpload"
              accept="image/*"
            >
              <el-button type="primary" :loading="uploading">
                {{ uploading ? '上传中...' : '上传图片' }}
              </el-button>
            </el-upload>
            <div v-if="form.imagePath" class="preview-area">
              <el-image
                :src="form.imagePath"
                fit="contain"
                style="max-width: 200px; max-height: 100px; margin-top: 10px;"
              />
              <span class="image-path">{{ form.imagePath }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="位置">
          <el-select v-model="form.position" placeholder="选择水印位置">
            <el-option
              v-for="opt in positionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="透明度">
          <el-slider
            v-model="form.opacity"
            :min="0"
            :max="1"
            :step="0.1"
            show-input
            :show-input-controls="false"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">
            保存配置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="help-text">
        <p><strong>说明：</strong></p>
        <ul>
          <li>水印仅应用于缩略图，原图保持不变</li>
          <li>私密链接下载的文件为无水印原图</li>
          <li>修改配置后，新上传的作品将使用新配置</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.settings-card {
  max-width: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-upload-area {
  display: flex;
  flex-direction: column;
}

.preview-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.image-path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.help-text {
  margin-top: 20px;
  padding: 12px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.help-text p {
  margin: 0 0 8px 0;
}

.help-text ul {
  margin: 0;
  padding-left: 20px;
}

.help-text li {
  margin-bottom: 4px;
}
</style>