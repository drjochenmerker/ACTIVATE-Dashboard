<script setup lang="ts">
import { useColorMode } from '@vueuse/core';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

/**
 * Participant Interface
 * Data structure for a conflict participant
 */
interface Participant {
  id: string;
  type: string;
}

/**
 * Conflict Interface
 * Data structure representing a conflict including participants and metadata
 */
interface Conflict {
  title: string;
  description?: string;
  author: string;
  timestamp?: Date;
  status: string;
  participants: Participant[];
  replies?: any[];
}

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

// Dynamically stored height of the popup
const popupHeight = ref(0);

/**
 * Updates the height of the popup box after DOM update
 * Uses nextTick to ensure accurate measurement
 */
const updatePopupHeight = () => {
  nextTick(() => {
    if (popupRef.value) {
      popupHeight.value = popupRef.value.offsetHeight;
    }
  });
};


/**
 * On mount:
 * - Strips HTML tags from description to avoid rendering
 * - Measures popup height
 */
onMounted(() => {
  props.hoveredConflictPoint.description = props.hoveredConflictPoint.description?.replace(/<\/?[^>]+(>|$)/g, "");
  updatePopupHeight();
});

/**
 * Watchers:
 * - Recalculate height on conflict change or position change
 */
watch(() => props.hoveredConflictPoint, updatePopupHeight);
watch(() => props.position, updatePopupHeight);

/**
 * Adjusted Position of the popup
 * Prevents overflow below the visible viewport
 * @returns updated top and left coordinates
 *
 * TODO: Replace hardcoded navbar offset (120px) with dynamic value
 */
const adjustedPosition = computed(() => {
  let top = props.position.y;
  const left = props.position.x;
  const viewportHeight = window.innerHeight;

  if (top + 120 + popupHeight.value > viewportHeight) {
    top = props.position.y - popupHeight.value - 10;
  }

  return { x: left, y: top };
});

</script>

<template>
  <div
    ref="popupRef"
    class="popup"
    :class="{'popup-dark' : mode === 'dark'}"
    :style="{ top: `${adjustedPosition.y}px`, left: `${adjustedPosition.x}px`}"
  >
    <b>{{ hoveredConflictPoint.title }}</b>
    <p v-if="hoveredConflictPoint.description">
      {{ hoveredConflictPoint.description }}
    </p>
    <p><strong>Author:</strong> {{ hoveredConflictPoint.author }}</p>
    <p>
      <strong>Timestamp:</strong>
      {{ hoveredConflictPoint.timestamp ? new Date(hoveredConflictPoint.timestamp).toLocaleString() : 'No timestamp available' }}
    </p>
    <p><strong>Status:</strong> {{ hoveredConflictPoint.status }}</p>
    <div v-if="hoveredConflictPoint.participants.length">
      <p><strong>Participants:</strong></p>
      <ul class="custom-list">
        <li
          v-for="(participant, index) in hoveredConflictPoint.participants"
          :key="index"
        >
          {{ participant.id }} - {{ participant.type }}
        </li>
      </ul>
    </div>
    <p v-if="hoveredConflictPoint.replies"><strong>Replies:</strong> {{ hoveredConflictPoint.replies.length }}</p>
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
