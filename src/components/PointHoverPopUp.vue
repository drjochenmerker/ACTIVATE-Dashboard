<script setup lang="ts">
import { Objective } from '@/data/knowledge_graph/structures';
//import { buildLanguageString } from '@/lib/utils';
//import { useSessionStore } from '@/stores/sessionStore';
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
    tooltip: string;
    content: Array<Objective>;
  };
  position: {
    x: number;
    y: number;
  };
}>();

//const sessionStore = useSessionStore();
const mode = useColorMode();

const popupRef = ref<HTMLElement | null>(null);
const popupStyle = ref({ top: props.position.y + "px", left: props.position.x + 'px' });

const updatePopupPosition = async (pos: { x: number; y: number }) => {
  await nextTick();
  if (!popupRef.value) return;

  const rect = popupRef.value.getBoundingClientRect();
  let adjustedX = pos.x;
  let adjustedY = pos.y;

  // Avoid bottom overflow
  if (adjustedY + rect.height > window.innerHeight - 10) {
    adjustedY = window.innerHeight - rect.height - 10;
  }

  // Default: try to show left of cursor
  adjustedX = pos.x - rect.width - 10;

  // If it would overflow left, flip to the right of cursor
  if (adjustedX < 10) {
    adjustedX = pos.x + 10;
  }

  popupStyle.value = {
    top: `${adjustedY}px`,
    left: `${adjustedX}px`,
  };
};

watch(() => props.position, updatePopupPosition, { immediate: true });



</script>


<template>
  <div ref="popupRef" class="popup" :class="{ 'popup-dark': mode === 'dark' }" :style="popupStyle">
    <b>{{ hoveredPoint.label }}:</b>
    <br>
    <p>{{ hoveredPoint.tooltip }}</p>

    <!-- TEMPORARY: not displaying the content list
    <ul class="custom-list">
      <li v-for="(item, index) in hoveredPoint.content" :key="index">
        {{ buildLanguageString(item, sessionStore.activeLanguage, true) }}
      </li>
    </ul>-->
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
  z-index: 10;
  max-width: 350px;
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