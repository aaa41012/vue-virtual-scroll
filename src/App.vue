<script setup lang="ts">
  import VirtualScrollList from './VirtualScrollList.vue';
</script>

<template>
  <div id="app">
    <VirtualScrollList></VirtualScrollList>
  </div>
</template>

<style>
#app {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* 全局樣式重置 */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
</style>