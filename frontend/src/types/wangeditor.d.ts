declare module '@wangeditor/editor-for-vue' {
  import { DefineComponent } from 'vue';
  export const Editor: DefineComponent<any, any, any>;
  export const Toolbar: DefineComponent<any, any, any>;
}

declare module '@wangeditor/editor' {
  export interface IDomEditor {
    destroy(): void;
    getHtml(): string;
    setHtml(html: string): void;
  }

  export interface IEditorConfig {
    placeholder?: string;
    MENU_CONF?: Record<string, any>;
  }

  export interface IToolbarConfig {
    excludeKeys?: string[];
  }
}