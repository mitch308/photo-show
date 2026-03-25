import { useDark, useToggle } from '@vueuse/core'

/**
 * 主题切换 composable
 * 使用 VueUse 的 useDark 实现深色/浅色主题切换
 * 主题选择会自动持久化到 localStorage
 */
export const useTheme = () => {
  // useDark 会自动在 html 元素上添加/移除 'dark' 类
  const isDark = useDark({
    storageKey: 'photo-show-theme',
    valueDark: 'dark',
    valueLight: 'light',
    initialValue: 'light', // 默认浅色主题
  })
  
  const toggleDark = useToggle(isDark)
  
  return { isDark, toggleDark }
}