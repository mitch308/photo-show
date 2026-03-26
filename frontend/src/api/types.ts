/**
 * API 响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

/**
 * 管理员信息
 */
export interface AdminInfo {
  id: string;
  username: string;
  email?: string;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: AdminInfo;
}

/**
 * 媒体项 - 作品中的单个媒体文件
 */
export interface MediaItem {
  id: string;
  workId: string;
  filePath: string;
  thumbnailSmall?: string | null;
  thumbnailLarge?: string | null;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  position: number;
  fileHash?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 作品
 */
export interface Work {
  id: string;
  title: string;
  description: string;
  // Legacy single-file fields (deprecated, use mediaItems instead)
  filePath: string;
  thumbnailSmall?: string | null;
  thumbnailLarge?: string | null;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  // New multi-media support
  mediaItems?: MediaItem[];
  position: number;
  isPinned: boolean;
  isPublic: boolean;
  viewCount: number;
  downloadCount: number;
  albums: Album[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  // Used for creation/update only
  albumIds?: string[];
  tagIds?: string[];
}

/**
 * 相册
 */
export interface Album {
  id: string;
  name: string;
  description: string;
  coverPath: string;
  position: number;
  works?: Work[];
}

/**
 * 标签
 */
export interface Tag {
  id: string;
  name: string;
  works?: Work[];
}

/**
 * 上传结果
 */
export interface UploadResult {
  filePath: string;
  thumbnailSmall: string | null;
  thumbnailLarge: string | null;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  fileHash?: string;
}

/**
 * 文件哈希检查结果
 */
export interface MediaCheckResult {
  exists: boolean;
  mediaItem?: MediaItem | null;
}

/**
 * 批量上传结果
 */
export interface BatchUploadResult {
  items: UploadResult[];
  errors?: string[];
}

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
  workCount?: number;
}