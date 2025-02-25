<script setup lang="ts">


defineProps<{
    hoveredPoint: {
      label: string;
      content: Array<string>;
    };
    position: {
      x: number;
      y: number;
    };

}>();

</script>

<template>
    <div class="popup" :style="{ top: `${position.y}px`, left: `${position.x}px` }">
      <h3>{{ hoveredPoint.label }}:</h3>
      <ul>
        <li v-for="(content, index) in hoveredPoint.content" :key="index">{{ content }}</li>
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
  </style>
  