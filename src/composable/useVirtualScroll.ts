import { ref, computed, onMounted, onBeforeUnmount, readonly, type Ref } from 'vue';

/**
 * 虛擬滾動配置選項
 */
export interface VirtualScrollOptions {
  /** 每個項目的固定高度 (px) */
  itemHeight: number;
  /** 可見區域上下額外渲染的項目數量，用於優化滾動體驗 */
  bufferSize?: number;
  /** 滾動事件節流間隔 (ms) */
  throttleDelay?: number;
}

/**
 * 虛擬滾動項目接口
 */
export interface VirtualScrollItem {
  id: number | string;
  [key: string]: any;
}

/**
 * 虛擬滾動 Composable
 * 
 * @param items 所有項目數據
 * @param options 配置選項
 * @returns 虛擬滾動相關的狀態和方法
 */
export function useVirtualScroll<T extends VirtualScrollItem>(
  items: Ref<T[]>,
  options: VirtualScrollOptions
) {
  const {
    itemHeight,
    bufferSize = 5,
    throttleDelay = 16 // 約 60fps
  } = options;

  // === 響應式狀態管理 ===
  
  /** 滾動容器的引用 */
  const containerRef = ref<HTMLElement | null>(null);
  
  /** 當前滾動位置 */
  const scrollTop = ref(0);
  
  /** 容器可視高度 */
  const containerHeight = ref(0);
  
  /** 節流定時器 */
  let throttleTimer: number | null = null;

  // === 核心計算屬性 ===
  
  /**
   * 列表總高度 - 用於生成正確的滾動條
   */
  const totalHeight = computed(() => items.value.length * itemHeight);

  /**
   * 計算當前可見項目的索引範圍
   * 包含緩衝區以提供更流暢的滾動體驗
   */
  const visibleRange = computed(() => {
    // 防護：確保必要數據存在
    if (!items.value.length || !containerHeight.value) {
      return { startIndex: 0, endIndex: 0 };
    }

    // 計算理論可見範圍
    const viewportStartIndex = Math.floor(scrollTop.value / itemHeight);
    const viewportEndIndex = Math.ceil((scrollTop.value + containerHeight.value) / itemHeight);

    // 添加緩衝區並確保索引在有效範圍內
    const startIndex = Math.max(0, viewportStartIndex - bufferSize);
    const endIndex = Math.min(items.value.length, viewportEndIndex + bufferSize);

    return { startIndex, endIndex };
  });

  /**
   * 當前需要渲染的項目列表
   * 只包含可見範圍內的項目，大大減少 DOM 節點數量
   */
  const visibleItems = computed(() => {
    const { startIndex, endIndex } = visibleRange.value;
    return items.value.slice(startIndex, endIndex);
  });

  /**
   * 渲染列表的垂直偏移量
   * 用於將可見項目定位到正確的滾動位置
   */
  const listOffset = computed(() => {
    return visibleRange.value.startIndex * itemHeight;
  });

  /**
   * 當前真正可見的項目 ID 集合
   * 基於容器視窗計算，不依賴 IntersectionObserver
   */
  const visibleItemIds = computed(() => {
    const ids = new Set<number | string>();
    
    if (!containerHeight.value) return ids;

    // 計算視窗內的項目索引範圍（不含緩衝區）
    const viewportStart = Math.floor(scrollTop.value / itemHeight);
    const viewportEnd = Math.ceil((scrollTop.value + containerHeight.value) / itemHeight);

    // 收集視窗內項目的 ID
    for (let i = viewportStart; i < Math.min(viewportEnd, items.value.length); i++) {
      if (items.value[i]) {
        ids.add(items.value[i].id);
      }
    }

    return ids;
  });

  // === 事件處理 ===

  /**
   * 節流版本的滾動事件處理器
   * 避免高頻滾動事件影響性能
   */
  const handleScroll = (event: Event) => {
    // 清除之前的定時器
    if (throttleTimer) {
      clearTimeout(throttleTimer);
    }

    // 設置新的節流定時器
    throttleTimer = window.setTimeout(() => {
      const target = event.target as HTMLElement;
      scrollTop.value = target.scrollTop;
      throttleTimer = null;
    }, throttleDelay);
  };

  /**
   * 監聽容器尺寸變化
   * 當窗口大小改變時更新容器高度
   */
  const updateContainerHeight = () => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight;
    }
  };

  /**
   * 滾動到指定項目
   * @param itemId 項目 ID
   * @param position 滾動位置 ('start' | 'center' | 'end')
   */
  const scrollToItem = (itemId: number | string, position: 'start' | 'center' | 'end' = 'start') => {
    const itemIndex = items.value.findIndex(item => item.id === itemId);
    if (itemIndex === -1 || !containerRef.value) return;

    let scrollPosition = itemIndex * itemHeight;

    // 根據位置調整滾動位置
    if (position === 'center') {
      scrollPosition -= containerHeight.value / 2 - itemHeight / 2;
    } else if (position === 'end') {
      scrollPosition -= containerHeight.value - itemHeight;
    }

    // 確保滾動位置在有效範圍內
    scrollPosition = Math.max(0, Math.min(scrollPosition, totalHeight.value - containerHeight.value));

    containerRef.value.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  };

  /**
   * 獲取項目在容器中的可見性狀態
   * @param itemId 項目 ID
   * @returns 可見性信息
   */
  const getItemVisibility = (itemId: number | string) => {
    const itemIndex = items.value.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return { isVisible: false, visibilityRatio: 0 };

    const itemTop = itemIndex * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const containerTop = scrollTop.value;
    const containerBottom = containerTop + containerHeight.value;

    // 檢查項目是否在可見範圍內
    const isVisible = itemBottom > containerTop && itemTop < containerBottom;

    // 計算可見比例
    let visibilityRatio = 0;
    if (isVisible) {
      const visibleTop = Math.max(itemTop, containerTop);
      const visibleBottom = Math.min(itemBottom, containerBottom);
      visibilityRatio = (visibleBottom - visibleTop) / itemHeight;
    }

    return { isVisible, visibilityRatio };
  };

  // === 生命週期管理 ===

  /** ResizeObserver 實例，用於監聽容器尺寸變化 */
  let resizeObserver: ResizeObserver | null = null;

  onMounted(() => {
    // 初始化容器高度
    updateContainerHeight();

    // 設置 ResizeObserver 監聽容器尺寸變化
    if (containerRef.value) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          containerHeight.value = entry.contentRect.height;
        }
      });
      resizeObserver.observe(containerRef.value);
    }
  });

  onBeforeUnmount(() => {
    // 清理節流定時器
    if (throttleTimer) {
      clearTimeout(throttleTimer);
    }

    // 斷開 ResizeObserver
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  });

  // === 返回 API ===
  
  return {
    // DOM 引用
    containerRef,
    
    // 響應式狀態
    scrollTop: readonly(scrollTop),
    containerHeight: readonly(containerHeight),
    
    // 計算屬性
    totalHeight,
    visibleItems,
    listOffset,
    visibleItemIds,
    visibleRange,
    
    // 方法
    handleScroll,
    scrollToItem,
    getItemVisibility,
    updateContainerHeight,
  };
}