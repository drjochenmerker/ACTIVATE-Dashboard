<script setup lang="ts">

defineProps<{
    hoveredPoint: {
      label: string;
      content: Array<{label: string, value?: string}>;
    };
    position: {
      x: number;
      y: number;
    };

}>();

</script>

<template>
    <div class="popup" :style="{ top: `${position.y}px`, left: `${position.x}px` }">
      <b>{{ hoveredPoint.label }}:</b>
      <ul class="custom-list">
        <li v-for="(item, index) in hoveredPoint.content" :key="index">
            {{ item.label }} <span v-if="item.value">- {{ item.value }}</span>
        </li>
      </ul>
    </div>
  </template>
  
  <style scoped>
  .popup {
    position: absolute;
    background-color: white;
    border: 1px solid black;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    pointer-events: none; /* Verhindert unerwünschte Hover-Events */
    z-index: 10;
  }

  .custom-list {
    list-style-type: disc;
  padding-left: 20px;
  margin: 0;
  }
  </style>
  