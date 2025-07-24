<template>
  <div class="app-container">
    <!-- 標題和統計信息 -->
    <header class="app-header">
      <h1>Vue 3 優化版虛擬滾動列表</h1>
      <div class="stats">
        <span class="stat-item">
          總項目數: <strong>{{ allItems.length }}</strong>
        </span>
        <span class="stat-item">
          渲染項目數: <strong>{{ visibleItems.length }}</strong> 
        </span>
        <span class="stat-item">
          可見項目數: <strong>{{ visibleItemIds.size }}</strong>
        </span>
      </div>
    </header>

    <!-- 操作按鈕區 -->
    <div class="controls">
      <button @click="scrollToItem(100, 'center')" class="control-btn">
        滾動到第 101 項 (居中)
      </button>
      <button @click="scrollToItem(500, 'start')" class="control-btn">
        滾動到第 501 項 (頂部)
      </button>
      <button @click="addMoreItems" class="control-btn">
        添加 1000 項數據
      </button>
    </div>
    
    <!-- 虛擬滾動容器 -->
    <div 
      ref="containerRef" 
      class="virtual-list-container" 
      @scroll="handleScroll"
    >
      <!-- 
        佔位元素：撐開滾動條的總高度
        這是虛擬滾動的關鍵 - 讓瀏覽器認為列表有完整的高度
      -->
      <div 
        class="list-sizer" 
        :style="{ height: `${totalHeight}px` }"
      ></div>

      <!-- 
        實際渲染的項目容器
        使用 transform: translateY 來定位到正確的滾動位置
        這比直接設置 top 屬性更高效，因為不會觸發 layout
      -->
      <div 
        class="list-wrapper" 
        :style="{ transform: `translateY(${listOffset}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="`item-${item.id}`"
          class="list-item"
          :style="{ 
            backgroundColor: item.color,
            height: `${ITEM_HEIGHT}px` 
          }"
          :class="{ 
            'is-visible': visibleItemIds.has(item.id),
            'is-even': item.id % 2 === 0 
          }"
        >
          <!-- 項目內容 -->
          <div class="item-content">
            <span class="item-id">ID: {{ item.id }}</span>
            <span class="item-text">{{ item.text }}</span>
            <span class="item-index">
              索引: {{ item.originalIndex }} / {{ allItems.length - 1 }}
            </span>
          </div>

          <!-- 可見性指示器 -->
          <div class="visibility-indicator">
            <span 
              v-if="visibleItemIds.has(item.id)" 
              class="visible-badge"
              :title="`可見比例: ${Math.round(getItemVisibility(item.id).visibilityRatio * 100)}%`"
            >
              👁️ 可見
            </span>
            <span v-else class="hidden-badge">
              📦 緩衝區
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 調試信息 (開發時可用) -->
    <div v-if="showDebugInfo" class="debug-info">
      <h3>調試信息</h3>
      <ul>
        <li>滾動位置: {{ Math.round(scrollTop) }}px</li>
        <li>容器高度: {{ Math.round(containerHeight) }}px</li>
        <li>可見範圍: {{ visibleRange.startIndex }} - {{ visibleRange.endIndex }}</li>
        <li>列表偏移: {{ Math.round(listOffset) }}px</li>
        <li>總高度: {{ Math.round(totalHeight) }}px</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useVirtualScroll, type VirtualScrollItem } from './composable/useVirtualScroll';

/**
 * 項目數據接口
 */
interface ListItem extends VirtualScrollItem {
  id: number;
  text: string;
  color: string;
  originalIndex: number;
}

// === 配置常量 ===

/** 每個項目的固定高度 (px) */
const ITEM_HEIGHT = 80;

/** 是否顯示調試信息 */
const showDebugInfo = ref(false); // 可以通過環境變量控制

// === 數據管理 ===

/** 所有項目數據 */
const allItems = ref<ListItem[]>([]);

/**
 * 生成模擬數據
 * @param count 生成數據的數量
 * @param startIndex 起始索引
 */
const generateMockData = (count: number, startIndex = 0): ListItem[] => {
  const data: ListItem[] = [];
  
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    data.push({
      id: index,
      originalIndex: index,
      text: `這是第 ${index + 1} 個項目 - ${generateRandomText()}`,
      // 使用 HSL 色彩空間生成漸變色
      color: `hsl(${(index * 137.5) % 360}, 65%, 85%)`,
    });
  }
  
  return data;
};

/**
 * 生成隨機文本內容
 */
const generateRandomText = (): string => {
  const texts = [
    '虛擬滾動優化性能',
    '高效渲染大量數據',
    '流暢的用戶體驗',
    '節省內存使用',
    'Vue 3 Composition API',
    '響應式數據綁定',
    '組件化開發模式',
    '現代前端架構'
  ];
  return texts[Math.floor(Math.random() * texts.length)];
};

/**
 * 添加更多項目到列表
 */
const addMoreItems = () => {
  const currentLength = allItems.value.length;
  const newItems = generateMockData(1000, currentLength);
  allItems.value.push(...newItems);
};

// === 使用虛擬滾動 Composable ===

const {
  containerRef,
  scrollTop,
  containerHeight,
  totalHeight,
  visibleItems,
  listOffset,
  visibleItemIds,
  visibleRange,
  handleScroll,
  scrollToItem,
  getItemVisibility,
} = useVirtualScroll(allItems, {
  itemHeight: ITEM_HEIGHT,
  bufferSize: 8, // 增加緩衝區大小以提供更流暢的體驗
  throttleDelay: 10, // 更頻繁的更新以獲得更好的響應性
});

// === 生命週期 ===

onMounted(() => {
  // 初始化數據
  allItems.value = generateMockData(10000);
  
  // 可以手動控制是否顯示調試信息
  showDebugInfo.value = false; // 改為 true 可顯示調試信息
});

</script>

<style scoped>
/* === 主容器樣式 === */
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* === 頭部樣式 === */
.app-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 2.2em;
  font-weight: 600;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.stat-item {
  color: #7f8c8d;
  font-size: 1.1em;
}

.stat-item strong {
  color: #27ae60;
  font-weight: 700;
}

/* === 控制按鈕樣式 === */
.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.control-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.control-btn:active {
  transform: translateY(0);
}

/* === 虛擬滾動容器樣式 === */
.virtual-list-container {
  height: 500px; /* 固定容器高度 */
  overflow-y: auto;
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e6ed;
}

/* 滾動條美化 */
.virtual-list-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
}

.virtual-list-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* === 列表樣式 === */
.list-sizer {
  /* 佔位元素，用於撐開滾動條 */
  width: 100%;
  pointer-events: none;
}

.list-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

/* === 列表項目樣式 === */
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ecf0f1;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

/* 偶數項目的額外樣式 */
.list-item.is-even {
  background-color: rgba(255, 255, 255, 0.5) !important;
}

/* 可見項目的高亮效果 */
.list-item.is-visible {
  border-left: 4px solid #27ae60;
  box-shadow: inset 0 0 0 1px rgba(39, 174, 96, 0.2);
}

.list-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* === 項目內容樣式 === */
.item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.item-id {
  font-weight: 700;
  color: #2c3e50;
  font-size: 0.9em;
}

.item-text {
  color: #34495e;
  font-size: 1em;
  line-height: 1.4;
}

.item-index {
  font-size: 0.8em;
  color: #7f8c8d;
  font-family: 'Courier New', monospace;
}

/* === 可見性指示器樣式 === */
.visibility-indicator {
  margin-left: 15px;
}

.visible-badge,
.hidden-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  white-space: nowrap;
}

.visible-badge {
  background: rgba(39, 174, 96, 0.1);
  color: #27ae60;
  border: 1px solid rgba(39, 174, 96, 0.3);
}

.hidden-badge {
  background: rgba(149, 165, 166, 0.1);
  color: #95a5a6;
  border: 1px solid rgba(149, 165, 166, 0.3);
}

/* === 調試信息樣式 === */
.debug-info {
  margin-top: 30px;
  padding: 20px;
  background: #2c3e50;
  color: white;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
}

.debug-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #ecf0f1;
}

.debug-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.debug-info li {
  padding: 5px 0;
  border-bottom: 1px solid #34495e;
}

.debug-info li:last-child {
  border-bottom: none;
}

/* === 響應式設計 === */
@media (max-width: 768px) {
  .app-container {
    padding: 15px;
  }
  
  .stats {
    gap: 15px;
  }
  
  .controls {
    gap: 10px;
  }
  
  .control-btn {
    padding: 10px 20px;
    font-size: 13px;
  }
  
  .virtual-list-container {
    height: 400px;
  }
  
  .list-item {
    padding: 12px 15px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .visibility-indicator {
    margin-left: 0;
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  .app-header h1 {
    font-size: 1.8em;
  }
  
  .stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .virtual-list-container {
    height: 350px;
  }
}</style>