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
 * 作品
 */
export interface Work {
  id: string;
  title: string;
  description: string;
  filePath: string;
  thumbnailSmall?: string | null;
  thumbnailLarge?: string | null;
  originalFilename: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
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
}