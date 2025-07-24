# Vue 3 Virtual Scrolling with IntersectionObserver Demo

This project demonstrates how to build a high-performance virtual scrolling list using Vue 3's Composition API and the browser's IntersectionObserver API.

## How to Run

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Core Concepts & Implementation Details

### 1. Data Structure & Reactive State (`<script setup>`)

-   `allItems`: A `ref` that holds the entire dataset (e.g., 1000 mock items).
-   `ITEM_HEIGHT`: A constant defining the fixed height for each list item. **A fixed height is crucial** for simplifying the calculations in virtual scrolling.
-   `containerRef`: A template ref to get the DOM element of the scrollable container.
-   `scrollTop`: A `ref` to store the current vertical scroll position of the container.
-   `visibleItemIds`: A `Set` used to store the IDs of items currently deemed visible by the `IntersectionObserver`. A `Set` is used for its efficient add, delete, and has operations.

### 2. Virtual Scrolling Core Logic (Computed Properties)

This is the heart of the "virtual" scrolling mechanism, based entirely on calculations derived from the scroll position.

-   `totalHeight`: Calculated as `total_items * item_height`. This determines the theoretical total height of the list and is used to set the height of a sizer element, which creates a correctly proportioned scrollbar.
-   `visibleRange`: Based on `scrollTop` and the container's height, this computes the start and end indices of the items that should currently be rendered in the DOM. We also add a `VISIBLE_ITEM_BUFFER` to render a few extra items above and below the viewport, preventing blank spaces during fast scrolling.
-   `visibleItems`: Uses the `slice` method to extract the items within the `visibleRange` from the `allItems` array. This sliced array is what `v-for` iterates over.
-   `listOffset`: Calculates the `translateY` offset for the list wrapper. Its value is `startIndex * ITEM_HEIGHT`, ensuring that the rendered items are always positioned correctly within the viewport, creating the illusion of a seamless, fully-rendered list.

### 3. IntersectionObserver Integration

-   `createObserver()`: Called in `onMounted`, this function initializes a new `IntersectionObserver`.
    -   `root`: Set to our scroll container (`containerRef`), confining the observation to within this element.
    -   `threshold: 0.5`: The callback is triggered when 50% of a target element becomes visible or hidden.
    -   **Callback Function**: When an item's visibility changes, its ID is added to or removed from the `visibleItemIds` `Set` based on the `entry.isIntersecting` boolean.
-   `setItemRef()`: This is a function ref used in the `v-for` loop. It's called whenever Vue mounts or unmounts a list item element.
    -   If `el` exists (the element is mounted), we start observing it with `observer.observe(el)`.
    -   If `el` is `null` (the element is unmounted), we stop observing it with `observer.unobserve(el)` to prevent memory leaks.

### 4. Template Structure (`<template>`)

-   `.virtual-list-container`: The scrollable container with a fixed height and `overflow-y: auto`. `position: relative` is essential as the inner list wrapper is positioned absolutely relative to it.
-   `.list-sizer`: An invisible helper element whose height is bound to `totalHeight`. Its sole purpose is to stretch the container's scrollable area to create a correctly sized scrollbar.
-   `.list-wrapper`: The wrapper for the actually rendered `visibleItems`. It uses `position: absolute` and `transform: translateY(...)` to be precisely positioned at the current scroll offset.
-   `.list-item`:
    -   `:class="{ 'is-visible': visibleItemIds.has(item.id) }"`: Dynamically applies the `is-visible` class based on the `IntersectionObserver`'s feedback.
    -   The item's `backgroundColor` is bound to a random color for easy visual distinction.
    -   The `.list-item.is-visible` CSS selector applies a fade-in and slide-up transition, providing a smooth user experience.

This demo effectively combines two powerful optimization techniques:

1.  **Virtual Scrolling**: Drastically reduces the number of DOM nodes, solving the performance bottleneck of long lists.
2.  **IntersectionObserver**: Detects element visibility with high performance, ideal for triggering animations, lazy loading, or other interactions without resorting to expensive calculations on the high-frequency `scroll` event.
