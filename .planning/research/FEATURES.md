# Feature Research

**Domain:** Photography Platform UI/UX Improvements (v1.2)
**Researched:** 2026-03-26
**Confidence:** HIGH

> **Note:** This is a subsequent milestone. v1.1 features (deduplication, thumbnails, file management, album sharing, studio intro) are now validated. This research focuses on v1.2 UI/UX improvements only.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a photography management platform.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Work detail view | Users need to see all files in a multi-file work | MEDIUM | Existing lightbox shows single image; need dedicated detail page showing all mediaItems |
| Search in admin lists | Standard CRUD operation - admins need to find records quickly | LOW | Element Plus el-table supports this; Clients.vue already has search input |
| Consistent admin styling | Professional appearance across all management pages | LOW | Shares/Clients use custom tables; Works uses el-table - unify |
| Responsive layouts | Platform supports mobile/tablet per constraints | MEDIUM | Cards must adapt; sidebar collapses on mobile |
| Sidebar navigation | Admin panels need persistent navigation | LOW | Already exists, needs independent scrolling fix |

### Differentiators (Competitive Advantage)

Features that improve UX beyond baseline expectations.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Gallery-style detail page | Shows all media items elegantly, not just table row | MEDIUM | Could use carousel, grid, or slider layout - matches photography aesthetic |
| Real-time filter feedback | Instant filtering as user types (debounced) | LOW | Use 300ms debounce like Clients.vue already does |
| Visual filter chips | Show active filters as removable chips | MEDIUM | Better UX than hidden filter state |
| Smooth sidebar scroll | Sidebar stays visible while scrolling content | LOW | CSS `position: sticky` + `overflow-y: auto` + `height: 100vh` |
| Card hover effects | Subtle animations enhance professional feel | LOW | CSS transitions on scale/shadow |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Complex multi-column filters | Power users want advanced search | Clutters UI, confuses casual users; overkill for current data volume | Simple search + status dropdown filters |
| Collapsible sidebar | Save screen space | Adds complexity; only ~220px width; desktop-focused admin | Fixed sidebar is fine for admin panel |
| Infinite scroll in admin tables | Modern feel | Pagination is clearer for admin tasks; need to know total count | Keep pagination, add search/filter instead |
| Masonry layout in admin | Match public gallery | Admin needs consistent row heights for scanning data; not for data tables | Keep tables in admin, masonry only for public |

## Feature Dependencies

```
Work Detail Page
    └──requires──> MediaItems API (EXISTS - v1.1)
    └──requires──> Work data with mediaItems populated (EXISTS)

Admin List Filters
    └──requires──> Backend filter endpoints (PARTIAL - some exist)
    └──enhances──> Consistent UI styling

Independent Sidebar Scroll
    └──requires──> CSS-only fix (no dependencies)

Responsive Card Layouts
    └──requires──> CSS Grid/Flexbox (native)
    └──enhances──> Mobile/tablet experience

UI Beautification
    └──requires──> Design tokens / CSS variables (exist via theme)
    └──enhances──> All other features
```

### Dependency Notes

- **Work Detail Page requires MediaItems API:** Already exists from v1.1 (`mediaItemsApi.addMediaItem()`, `mediaItemsApi.deleteMediaItem()`)
- **Admin List Filters requires backend support:** Some endpoints support search (Clients), others may need filter params added
- **Independent Sidebar Scroll:** Pure CSS fix, no backend changes needed
- **UI Beautification enhances all features:** Apply consistent spacing, shadows, transitions across components

## Detailed Feature Analysis

### 1. Work Detail Page (Showing All Files in a Work)

**Current State:**
- Works.vue has file management in edit dialog (v1.1)
- Lightbox shows single image at a time
- No dedicated public-facing detail view for multi-file works
- Clicking work card in public gallery opens lightbox for first image only

**Expected Behavior:**
- User clicks a work card in public gallery
- Opens detail view showing ALL media items in that work
- Each file can be viewed full-size
- Grid or carousel layout for multiple files
- Download available for private links

**Implementation Options:**
| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| Expand existing Lightbox | Reuses component | Lightbox not designed for multi-file navigation | No |
| New WorkDetail component | Clean separation, reusable | More code | Yes |
| Modal/Drawer from WorkCard | Quick to implement | Limited space for many files | No |

**Recommended Approach:** Create new `WorkDetail.vue` component with:
- Grid layout showing all thumbnails
- Click thumbnail to open full-size viewer
- Swipe/arrow navigation between files
- Download button (for private links)
- Work title, description, metadata

**Complexity:** MEDIUM - New component, routing, state management

**Backend:** No changes needed - existing `/api/public/works/:id` returns work with mediaItems

### 2. Admin List Filter/Search

**Current State:**
| Page | Search | Filter | Status |
|------|--------|--------|--------|
| Works.vue | No | No | Needs both |
| Shares.vue | No | No | Needs both |
| Clients.vue | Yes (debounced) | No | Has search, needs filter |
| Albums.vue | No | No | Needs search |
| Tags.vue | No | No | Needs search |

**Expected Behavior:**
- Search input in page header
- Filter dropdowns for common filters:
  - Works: status (public/private), album, tag, type (image/video)
  - Shares: status (active/expired), type (work/album)
  - Clients: (search only is sufficient)
  - Albums: (search only is sufficient)
  - Tags: (search only is sufficient)
- Debounced search (300ms) - pattern exists in Clients.vue
- Clear filters button

**Implementation Pattern (from Clients.vue):**
```typescript
// Debounced search - REUSE THIS PATTERN
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    clientsStore.fetchClients({ search: searchQuery.value });
  }, 300);
});
```

**Backend Requirements:**
- Most list endpoints already support `search` query param
- Add filter params: `status`, `albumId`, `tagId`, `type` to works endpoint
- Add filter params: `status`, `type` to shares endpoint

**Complexity:** LOW - Standard Element Plus components, some backend additions

### 3. Responsive Card Layouts

**Current State:**
- Settings.vue has fixed `max-width: 600px` on `.settings-card`
- Overview.vue uses `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`
- Inconsistent responsive behavior across pages

**Expected Behavior:**
- Cards adapt to container width
- Mobile: Single column
- Tablet: Two columns
- Desktop: Auto-fit based on content

**Solution:**
```css
.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* Settings page - remove fixed max-width */
.settings-card {
  /* Remove: max-width: 600px; */
  width: 100%;
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }
}
```

**Affected Pages:**
- Settings.vue - Watermark card, Studio info card
- Overview.vue - Stat cards (already good)

**Complexity:** LOW - CSS-only fix

### 4. Independent Sidebar Scrolling

**Current State (Dashboard.vue):**
```css
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  /* No height/overflow constraints - scrolls with page */
}

.main {
  flex: 1;
  overflow-y: auto;
}
```

**Problem:** 
- Sidebar content can push footer buttons off-screen on long nav lists
- When main content is long, sidebar scrolls away with it
- User loses navigation context

**Expected Behavior:**
- Sidebar scrolls independently from main content
- Logo and footer buttons remain visible
- Nav items scroll when list is long
- Main content scrolls independently

**Solution:**
```css
.sidebar {
  width: 220px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
}

.nav {
  flex: 1;
  overflow-y: auto;  /* Independent scroll for nav items */
}

.sidebar-footer {
  flex-shrink: 0;  /* Always visible at bottom */
}
```

**Complexity:** LOW - CSS-only fix

### 5. UI Beautification

**Current Issues:**
- Inconsistent spacing (16px vs 20px vs 24px padding)
- Mixed component styles (custom tables vs Element Plus tables)
- Limited visual hierarchy
- No hover/transition effects on some interactive elements

**Beautification Checklist:**
- [ ] Standardize spacing using CSS variables
- [ ] Add subtle shadows on cards
- [ ] Smooth transitions on hovers (0.2s ease)
- [ ] Consistent border-radius (8px for cards, 4px for inputs)
- [ ] Better empty states
- [ ] Loading skeleton states

**CSS Variables to Add:**
```css
:root {
  /* Spacing scale */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border radius scale */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
}
```

**Unified Admin Styling:**
| Page | Current Style | Target Style |
|------|--------------|--------------|
| Works.vue | el-table (Element Plus) | Keep, add filter |
| Shares.vue | Custom `<table>` | Convert to el-table |
| Clients.vue | Custom `<table>` | Convert to el-table |
| Albums.vue | el-table | Keep, add search |
| Tags.vue | el-table | Keep, add search |

**Complexity:** LOW-MEDIUM - Systematic CSS updates, no logic changes

## MVP Definition for v1.2

### Launch With (v1.2 Minimum)

Minimum for this milestone — fixes and improvements.

- [ ] **Work detail page** — Core new feature, users need to see multi-file works in public gallery
- [ ] **Independent sidebar scroll** — CSS fix, improves admin navigation UX
- [ ] **Admin list filters** — Essential for finding records (Works, Shares minimum)
- [ ] **Responsive card layouts** — Mobile/tablet support per project constraints
- [ ] **Unified admin styling** — Professional consistency across Shares/Clients pages

### Add After Validation (v1.3+)

- [ ] Visual filter chips — Enhanced UX for complex filtering
- [ ] Gallery-style detail view with carousel — Polish beyond basic grid
- [ ] Keyboard shortcuts in admin — Power user feature
- [ ] Bulk action improvements — Already has batch operations, can enhance

### Future Consideration (v2+)

- [ ] Advanced multi-column filters — If user feedback requests it
- [ ] Customizable admin dashboard — Widget-based layout
- [ ] Export data functionality — CSV/Excel export

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Work detail page | HIGH | MEDIUM | P1 |
| Independent sidebar scroll | MEDIUM | LOW | P1 |
| Admin list filters | HIGH | LOW | P1 |
| Responsive cards | MEDIUM | LOW | P1 |
| UI beautification | MEDIUM | MEDIUM | P2 |
| Unified admin styling | HIGH | LOW | P1 |
| Filter chips | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Implementation Notes

### Reusing Existing Patterns

1. **Search pattern from Clients.vue (REUSE):**
```typescript
// Debounced search - already implemented
let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    clientsStore.fetchClients({ search: searchQuery.value });
  }, 300);
});
```

2. **Grid layout from Overview.vue (REUSE):**
```css
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
```

3. **Element Plus table with selection (Works.vue - REUSE):**
```vue
<el-table :data="items" @selection-change="handleSelectionChange">
  <el-table-column type="selection" width="55" />
  <!-- ... columns ... -->
</el-table>
```

### New Patterns Needed

1. **WorkDetail component** - Create new, follow existing card/gallery patterns
2. **FilterBar component** - Reusable across admin pages (search + filters)
3. **Design tokens** - Centralize CSS variables for consistent theming

## Sources

- **Element Plus Table documentation** — HIGH confidence, official docs at element-plus.org
- **CSS-Tricks sticky sidebar article** — HIGH confidence, CSS pattern for independent scrolling
- **Existing codebase analysis** — HIGH confidence, direct file reading
  - Clients.vue: Search debounce pattern
  - Overview.vue: Responsive grid pattern
  - Works.vue: Element Plus table with batch operations
  - Dashboard.vue: Current sidebar layout
  - Settings.vue: Card layout with fixed width issue

---
*Feature research for: Photography Platform UI/UX Improvements (v1.2)*
*Researched: 2026-03-26*