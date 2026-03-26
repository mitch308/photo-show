export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
}

export interface StudioInfo {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
}