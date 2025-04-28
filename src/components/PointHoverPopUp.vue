<script setup lang="ts">
import { Objective } from '@/data/knowledge_graph/structures';
import { useSessionStore } from '@/stores/sessionStore';
import { useColorMode } from '@vueuse/core';
import { defineProps, nextTick, ref, watch } from 'vue';

/**
 * Props of the PointHoverPopUp component
 * @property hoveredPoint - Information about the hovered point, including its label and details
 * @property position - Position of the mouse cursor to position the popup accordingly
 */
const props = defineProps<{
  hoveredPoint: {
    label: string;
    content: Array<Objective>;
  };
  position: {
    x: number;
    y: number;
  };

}>();

const sessionStore = useSessionStore();

const popupRef = ref<HTMLElement | null>(null);
const popupStyle = ref({ top: props.position.x + "px", left: props.position.y + 'px' });

watch(() => props.position, async (pos) => {
  await nextTick();
  if (popupRef.value) {
    const rect = popupRef.value.getBoundingClientRect();
    if (pos.y + rect.height > window.innerHeight - 10) {
      pos.y = window.innerHeight - rect.height - 10;
    }
    popupStyle.value = {
      top: `${pos.y}px`,
      left: `${pos.x - rect.width - 10}px`
    };
  }
});

// Current color mode (Light- or Dark-Mode)
const mode = useColorMode()

</script>

<template>
  <div ref="popupRef" class="popup" :class="{'popup-dark' : mode === 'dark'}" :style="popupStyle">
    <b>{{ hoveredPoint.label }}:</b>
    <ul class="custom-list">
      <li v-for="(item, index) in hoveredPoint.content" :key="index">
        {{ item.labels[sessionStore.activeLanguage].split("/").pop() }}
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