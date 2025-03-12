<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { defineProps } from 'vue';


defineProps<{
  hoveredPoint: {
    label: string;
    content: Array<{label: string; value?: string}>;
  };
  position: {
    x: number;
    y: number;
  };

}>();

const mode = useColorMode()

</script>

<template>
  <div class="popup" :class="{'popup-dark' : mode === 'dark'}" :style="{ top: `${position.y}px`, left: `${position.x}px` }">
    <b>{{ hoveredPoint.label }}:</b>
    <ul class="custom-list">
      <li v-for="(item, index) in hoveredPoint.content" :key="index">
        {{ item.label }}
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
  pointer-events: none;
  /* Verhindert unerwünschte Hover-Events */
  z-index: 10;
  opacity: 0.9;
}

.popup-dark {
  color: #fff;
  background-color: #333;
}

.custom-list {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.custom-list li:hover {
  background-color: #f0f0f0;
}

.custom-list li.selected {
  background-color: #d1e7dd;
  font-weight: bold;
  color: #0f5132;
}
</style>