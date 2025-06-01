<script setup lang="ts">
import { activateTerms, staticContent } from '@/data/contentData';
import { Conflict } from '@/data/knowledge_graph/structures';
import { buildLanguageString } from '@/lib/utils';
import { useSessionStore } from '@/stores/sessionStore';
import { useColorMode } from '@vueuse/core';
import { nextTick, onMounted, ref, watch } from 'vue';

/**
 * Props of the ConflictHoverPopUp component
 * @property hoveredConflictPoint - Data of the conflict that is currently hovered
 * @property position - Position of the cursor to position the popup
 */
const props = defineProps<{
  hoveredConflictPoint: Conflict;
  position: { x: number; y: number };
}>();

// Current color mode (Light- or Dark-Mode)
const mode = useColorMode();

/**
 * Ref to the popup element
 * Used to measure the height dynamically
 */
const popupRef = ref<HTMLElement | null>(null);
const popupStyle = ref({ top: props.position.x + "px", left: props.position.y + 'px' });

onMounted(() => {
  props.hoveredConflictPoint.description = props.hoveredConflictPoint.description?.replace(/<\/?[^>]+(>|$)/g, "");
  updatePopupHeight(props.position);
});

watch(() => props.hoveredConflictPoint, () => updatePopupHeight(props.position));
watch(() => props.position, (newVal) => updatePopupHeight(newVal));

/**
 * Updates the height of the popup box after DOM update
 * Uses nextTick to ensure accurate measurement
 */
const updatePopupHeight = (pos: any) => {
  nextTick(() => {
    if (popupRef.value) {
      const rect = popupRef.value.getBoundingClientRect();
      let adjustedX = pos.x;
      let adjustedY = pos.y;

      // Prevent bottom overflow
      if (adjustedY + rect.height > window.innerHeight - 10) {
        adjustedY = window.innerHeight - rect.height - 10;
      }

      // Prefer showing the popup to the left of the cursor
      adjustedX = adjustedX - rect.width - 10;

      // If it overflows to the left, move it to the right side of the cursor
      if (adjustedX < 10) {
        adjustedX = pos.x + 10;
      }

      popupStyle.value = {
        top: `${adjustedY}px`,
        left: `${adjustedX}px`
      };
    }
  });
};


const sessionStore = useSessionStore();

/**
 * On mount:
 * - Strips HTML tags from description to avoid rendering
 * - Measures popup height
 */
onMounted(() => {
  props.hoveredConflictPoint.description = props.hoveredConflictPoint.description?.replace(/<\/?[^>]+(>|$)/g, "");
  updatePopupHeight({});
});

/**
 * Watchers:
 * - Recalculate height on conflict change or position change
 */
watch(() => props.hoveredConflictPoint, updatePopupHeight);
watch(() => props.position, updatePopupHeight);

</script>

<template>
  <div ref="popupRef" class="popup" :class="{ 'popup-dark': mode === 'dark' }" :style="popupStyle">
    <b>{{ hoveredConflictPoint.title }}</b>
    <p v-if="hoveredConflictPoint.description">
      {{ hoveredConflictPoint.description }}
    </p>
    <p><strong>{{ staticContent.terms.author[sessionStore.activeLanguage] }}:</strong> {{ hoveredConflictPoint.author }}
    </p>
    <p>
      <strong>{{ staticContent.terms.timestamp[sessionStore.activeLanguage] }}:</strong>
      {{ hoveredConflictPoint.timestamp ? new Date(hoveredConflictPoint.timestamp).toLocaleString() :
        staticContent.errors.timestampLoad[sessionStore.activeLanguage] }}
    </p>
    <p><strong>{{ staticContent.terms.status[sessionStore.activeLanguage] }}:</strong> {{
      staticContent.terms.conflictStatus[hoveredConflictPoint.status][sessionStore.activeLanguage] }}</p>
    <div v-if="hoveredConflictPoint.participants.length">
      <p><strong>{{ staticContent.terms.participants[sessionStore.activeLanguage] }}:</strong></p>
      <ul class="custom-list">
        <li v-for="(participant, index) in hoveredConflictPoint.participants" :key="index">
          {{ buildLanguageString(participant, sessionStore.activeLanguage, true) }} - {{
            activateTerms[sessionStore.activeLanguage][participant.type] }}
        </li>
      </ul>
    </div>
    <p v-if="hoveredConflictPoint.replies">
      <strong>{{ staticContent.terms.replies[sessionStore.activeLanguage] }}:</strong> {{
        hoveredConflictPoint.replies.length }}
    </p>
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
  opacity: 0.9;
  max-width: 350px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
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
