# Phase 16: 布局优化 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

优化后台管理界面布局，解决侧边栏滚动和卡片宽度问题。

**交付内容：**
- AUX-05: 侧边栏导航独立滚动
- AUX-06: 系统设置卡片自适应宽度

**不包含：**
- 侧边栏折叠功能
- 响应式布局重构
- 其他页面布局调整

</domain>

<decisions>
## Implementation Decisions

### 侧边栏滚动

- **D-01:** 仅 `.nav` 区域独立滚动
  - 添加 `overflow-y: auto` 让导航区域可滚动
  - 添加 `min-height: 0` 确保 flex 子元素可以收缩
  - 理由：最小改动，仅影响导航区域，logo 和 footer 固定不动

### 卡片宽度

- **D-02:** 移除 `max-width: 600px` 限制
  - 卡片完全自适应屏幕宽度
  - 理由：系统设置表单内容较多，宽屏下可以利用更多空间

### Claude's Discretion

- 滚动条样式（使用浏览器默认或自定义）
- 卡片内边距调整（如需要）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 需求文档
- `.planning/REQUIREMENTS.md` — AUX-05, AUX-06 详细需求

### 现有实现
- `frontend/src/views/admin/Dashboard.vue` — 后台布局主文件，包含侧边栏结构
- `frontend/src/views/admin/Settings.vue` — 系统设置页面，包含卡片宽度限制

### CSS 变量
- `frontend/src/styles/variables.css` — 主题变量定义

</canonical_refs>

<code_context>
## Existing Code Insights

### 需要修改的文件

**Dashboard.vue (侧边栏滚动):**
```css
/* 当前代码 */
.nav {
  flex: 1;
  padding: 20px 0;
}

/* 修改后 */
.nav {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
  min-height: 0;
}
```

**Settings.vue (卡片宽度):**
```css
/* 当前代码 */
.settings-card {
  max-width: 600px;
}

/* 修改后 */
.settings-card {
  /* 移除 max-width 限制 */
}
```

### 集成点

- Dashboard.vue 的 `.nav` 样式
- Settings.vue 的 `.settings-card` 样式

</code_context>

<specifics>
## Specific Ideas

- 侧边栏滚动时保持 logo 和 footer 固定
- 大屏幕上设置卡片可以利用更多空间显示内容

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-布局优化*
*Context gathered: 2026-03-27*