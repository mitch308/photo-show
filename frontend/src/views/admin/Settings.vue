<script setup lang="ts">
import { ref, onMounted, shallowRef, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { settingsApi } from '@/api/settings';
import type { WatermarkConfig, StudioInfo } from '@/types/settings';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';

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

// Studio info state
const studioForm = ref<StudioInfo>({
  name: '',
  logo: '',
  phone: '',
  email: '',
  address: '',
  description: ''
});
const studioSaving = ref(false);
const logoUploading = ref(false);

// Rich text editor
const editorRef = shallowRef<IDomEditor>();

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入工作室介绍...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        const result = await settingsApi.uploadStudioLogo(file);
        insertFn(result.logoPath, file.name, result.logoPath);
      }
    }
  }
};

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video']
};

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor) {
    editor.destroy();
  }
});

onMounted(async () => {
  await loadConfig();
  await loadStudioInfo();
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

async function loadStudioInfo() {
  try {
    const info = await settingsApi.getStudioInfo();
    studioForm.value = info;
  } catch (error: any) {
    ElMessage.error(error.message || '加载工作室信息失败');
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

async function saveStudioInfo() {
  if (!studioForm.value.name.trim()) {
    ElMessage.warning('工作室名称不能为空');
    return;
  }

  studioSaving.value = true;
  try {
    await settingsApi.setStudioInfo(studioForm.value);
    ElMessage.success('工作室信息已保存');
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    studioSaving.value = false;
  }
}

async function handleLogoUpload(options: any) {
  logoUploading.value = true;
  try {
    const result = await settingsApi.uploadStudioLogo(options.file);
    studioForm.value.logo = result.logoPath;
    ElMessage.success('Logo上传成功');
  } catch (error: any) {
    ElMessage.error(error.message || '上传失败');
  } finally {
    logoUploading.value = false;
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

    <el-card class="settings-card studio-card">
      <template #header>
        <div class="card-header">
          <span>工作室信息</span>
        </div>
      </template>

      <el-form :model="studioForm" label-width="100px">
        <el-form-item label="工作室名称" required>
          <el-input
            v-model="studioForm.name"
            placeholder="请输入工作室名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="Logo">
          <div class="logo-upload-area">
            <el-upload
              :show-file-list="false"
              :http-request="handleLogoUpload"
              accept="image/*"
            >
              <el-button type="primary" :loading="logoUploading">
                {{ logoUploading ? '上传中...' : '上传Logo' }}
              </el-button>
            </el-upload>
            <div v-if="studioForm.logo" class="logo-preview">
              <el-image
                :src="studioForm.logo"
                fit="contain"
                style="max-width: 200px; max-height: 80px;"
              />
              <el-button
                type="danger"
                size="small"
                @click="studioForm.logo = ''"
                link
              >
                移除
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="联系电话">
          <el-input
            v-model="studioForm.phone"
            placeholder="请输入联系电话"
            maxlength="20"
          />
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input
            v-model="studioForm.email"
            placeholder="请输入邮箱地址"
            maxlength="50"
          />
        </el-form-item>

        <el-form-item label="地址">
          <el-input
            v-model="studioForm.address"
            placeholder="请输入工作室地址"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="工作室介绍">
          <div style="border: 1px solid var(--el-border-color); border-radius: 4px; width: 100%;">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="simple"
              style="border-bottom: 1px solid var(--el-border-color);"
            />
            <Editor
              v-model="studioForm.description"
              :defaultConfig="editorConfig"
              mode="simple"
              style="height: 300px; overflow-y: hidden;"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveStudioInfo" :loading="studioSaving">
            保存工作室信息
          </el-button>
        </el-form-item>
      </el-form>
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
  /* Card width now adapts to screen width */
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

.studio-card {
  margin-top: 20px;
}

.logo-upload-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.logo-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.w-e-text-container {
  background: var(--el-bg-color);
}

.w-e-text-container [data-slate-editor] {
  min-height: 280px;
}
</style>