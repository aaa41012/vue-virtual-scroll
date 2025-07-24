# Vue 3 虛擬滾動組件

一個高性能、功能完整的 Vue 3 虛擬滾動實現，支持處理大量數據而不影響頁面性能。

## 🚀 特性

- **高性能渲染**: 只渲染可見區域的 DOM 元素，支持百萬級數據
- **平滑滾動體驗**: 智能緩衝區和節流優化確保流暢滾動
- **TypeScript 支持**: 完整的類型定義和類型安全
- **Composable 架構**: 邏輯抽取為可復用的 Composable
- **響應式設計**: 自適應不同屏幕尺寸
- **豐富的 API**: 提供滾動控制、可見性檢測等功能

## 📁 文件結構

```
src/
├── useVirtualScroll.ts      # 虛擬滾動 Composable
├── VirtualScrollList.vue    # 虛擬滾動組件
└── README.md               # 說明文檔
```

## 🔧 核心原理

### 1. 虛擬滾動基本概念

虛擬滾動是一種優化技術，解決了渲染大量列表項時的性能問題：

```
傳統方式: 渲染 10,000 個 DOM 元素 ❌
虛擬滾動: 僅渲染 ~20 個可見元素 ✅
```

### 2. 實現原理

#### 核心組件構成:

1. **容器 (Container)**: 固定高度的滾動容器
2. **佔位器 (Sizer)**: 撐開總高度以產生正確滾動條
3. **渲染窗口 (Viewport)**: 實際渲染的 DOM 元素區域

```
┌─────────────────┐ ← 容器 (可視區域)
│ ┌─────────────┐ │ ← 渲染窗口 (transform: translateY)
│ │   Item 10   │ │
│ │   Item 11   │ │
│ │   Item 12   │ │ ← 只渲染可見+緩衝區的項目
│ │   Item 13   │ │
│ │   Item 14   │ │
│ └─────────────┘ │
└─────────────────┘
      ↑
  佔位器高度 = 總項目數 × 項目高度
```

#### 關鍵計算公式:

```typescript
// 可見範圍計算
startIndex = floor(scrollTop / itemHeight) - bufferSize
endIndex = ceil((scrollTop + containerHeight) / itemHeight) + bufferSize

// 渲染窗口定位
translateY = startIndex × itemHeight
```

### 3. 優化策略

#### 性能優化:
- **節流滾動事件**: 限制事件觸發頻率 (16ms ≈ 60fps)
- **緩衝區機制**: 額外渲染上下文項目，減少滾動時的閃爍
- **Transform 定位**: 使用 `translateY` 而非 `top` 避免重排

#### 內存優化:
- **動態 DOM 管理**: 滾動時自動創建/銷毀 DOM 元素
- **WeakMap 引用**: 避免內存洩