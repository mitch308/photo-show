# 计划 12-02: 前端相册分享功能

## 目标

实现前端相册分享页面和管理功能。

## 实现步骤

### Step 1: 扩展类型定义

**文件**: `frontend/src/api/types.ts`

添加相册分享相关类型：

```typescript
/**
 * 相册分享数据
 */
export interface AlbumShareData {
  token: string;
  album: {
    id: string;
    name: string;
    description: string;
    coverPath: string;
  };
  works: Work[];
  expiresAt: number;
}

/**
 * 相册分享信息（管理端）
 */
export interface AlbumShareInfo {
  token: string;
  albumId: string;
  albumName: string;
  expiresAt: number;
  createdAt: number;
  shareUrl?: string;
  maxAccess?: number;
  accessCount?: number;
  clientId?: string;
}
```

### Step 2: 扩展分享 API

**文件**: `frontend/src/api/share.ts`

添加相册分享 API 方法：

```typescript
// 在 shareApi 对象中添加:

// 获取相册分享数据
async getAlbumShare(token: string): Promise<AlbumShareData> {
  const response = await api.get<ApiResponse<AlbumShareData>>(`/album-share/${token}`);
  return response.data.data;
},

// 获取相册分享下载 URL
getAlbumDownloadUrl(token: string, workId: string, mediaId?: string): string {
  if (mediaId) {
    return `${api.defaults.baseURL}/album-share/${token}/download/${workId}/media/${mediaId}`;
  }
  return `${api.defaults.baseURL}/album-share/${token}/download/${workId}`;
},

// 创建相册分享链接
async createAlbumShare(data: {
  albumId: string;
  expiresInDays?: number;
  maxAccess?: number;
  clientId?: string;
}): Promise<AlbumShareInfo> {
  const response = await api.post<ApiResponse<AlbumShareInfo>>('/admin/share/album', data);
  return response.data.data;
},
```

### Step 3: 创建相册分享页面

**文件**: `frontend/src/views/AlbumShare.vue`

参考现有 `Share.vue` 页面结构，创建相册分享页面：

- 显示相册名称和描述
- 显示作品网格（与 Share.vue 类似）
- 支持下载作品
- 支持下载特定媒体项
- 显示过期时间

关键差异：
- 页面标题显示相册名称
- 添加相册描述展示
- 使用 `/album-share/:token` API

### Step 4: 更新相册管理页面

**文件**: `frontend/src/views/admin/Albums.vue`

在相册列表中添加分享按钮：

```vue
<el-table-column label="操作" width="200">
  <template #default="{ row }">
    <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
    <el-button link type="success" @click="openShareDialog(row)">分享</el-button>
    <el-button link type="danger" @click="deleteAlbum(row)">删除</el-button>
  </template>
</el-table-column>
```

添加分享对话框：

```vue
<script setup lang="ts">
// 添加分享相关状态
const shareDialogVisible = ref(false);
const sharingAlbum = ref<Album | null>(null);
const shareForm = ref({
  expiresInDays: 7,
  maxAccess: undefined as number | undefined,
  clientId: '',
});
const generatedShareUrl = ref('');

function openShareDialog(album: Album) {
  sharingAlbum.value = album;
  shareForm.value = { expiresInDays: 7, maxAccess: undefined, clientId: '' };
  generatedShareUrl.value = '';
  shareDialogVisible.value = true;
}

async function createAlbumShare() {
  if (!sharingAlbum.value) return;
  
  try {
    const result = await shareApi.createAlbumShare({
      albumId: sharingAlbum.value.id,
      expiresInDays: shareForm.value.expiresInDays,
      maxAccess: shareForm.value.maxAccess,
      clientId: shareForm.value.clientId || undefined,
    });
    
    generatedShareUrl.value = result.shareUrl || '';
    await navigator.clipboard.writeText(generatedShareUrl.value);
    ElMessage.success('分享链接已创建并复制到剪贴板');
  } catch (error: any) {
    ElMessage.error('创建分享链接失败：' + error.message);
  }
}

async function copyShareUrl() {
  if (generatedShareUrl.value) {
    await navigator.clipboard.writeText(generatedShareUrl.value);
    ElMessage.success('链接已复制');
  }
}
</script>
```

### Step 5: 更新分享管理页面

**文件**: `frontend/src/views/admin/Shares.vue`

修改分享列表以支持相册分享显示：

1. 更新 ShareInfo 类型（或添加 albumId/albumName 字段）
2. 在表格中区分显示：
   - 作品分享：显示作品数量
   - 相册分享：显示相册名称
3. 分享 URL 根据类型使用不同路径

```vue
<el-table-column label="类型" width="100">
  <template #default="{ row }">
    <el-tag v-if="row.albumId" type="success">相册</el-tag>
    <el-tag v-else>作品</el-tag>
  </template>
</el-table-column>

<el-table-column label="名称" min-width="150">
  <template #default="{ row }">
    {{ row.albumName || `${row.workIds?.length || 0} 个作品` }}
  </template>
</el-table-column>
```

### Step 6: 添加路由

**文件**: `frontend/src/router/index.ts`

添加相册分享路由：

```typescript
{
  path: '/album-share/:token',
  name: 'AlbumShare',
  component: () => import('@/views/AlbumShare.vue'),
  meta: { public: true },
},
```

## 文件清单

### 新增文件
- `frontend/src/views/AlbumShare.vue` - 相册分享页面

### 修改文件
- `frontend/src/api/types.ts` - 添加相册分享类型
- `frontend/src/api/share.ts` - 添加相册分享 API
- `frontend/src/views/admin/Albums.vue` - 添加分享按钮和对话框
- `frontend/src/views/admin/Shares.vue` - 支持相册分享显示
- `frontend/src/router/index.ts` - 添加相册分享路由

## 验证要点

1. 相册管理页面显示分享按钮
2. 点击分享按钮打开分享对话框
3. 创建分享链接成功并复制到剪贴板
4. 访问分享链接显示相册名称和作品列表
5. 可以下载作品
6. 分享管理页面正确显示相册分享
7. 过期链接正确提示