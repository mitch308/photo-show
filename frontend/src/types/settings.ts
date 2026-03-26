export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text?: string;
  imagePath?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
}