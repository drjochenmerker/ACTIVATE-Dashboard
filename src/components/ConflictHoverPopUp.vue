<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// Datenstruktur für die Beteiligten Parteien eines Konflikts
interface Participant {
  id: string;
  type: string;
}

// Datenstruktur für einen Konflikt
interface Conflict {
  title: string;
  description?: string;
  author: string;
  timestamp?: Date;
  status: string;
  participants: Participant[];
  replies?: any[];
}

// Props für das Popup
const props = defineProps<{
  hoveredConflictPoint: Conflict;
  position: { x: number; y: number };
}>();

// Alles was folgt ist nötig für die Anpassung der Popup-Position, damit es nicht über den unteren Bildschirmrand hinausragt:

// Ref für das Popup-Element
const popupRef = ref<HTMLElement | null>(null);

// Höhe des Popups
const popupHeight = ref(0);

// Beim Mounten und wenn sich das Popup ändert, wird die Höhe des Popups neu gemessen
const updatePopupHeight = () => {
  nextTick(() => {
    if (popupRef.value) {
      popupHeight.value = popupRef.value.offsetHeight;
    }
  });
};

onMounted(() => {
  updatePopupHeight();
});

// Falls sich die Position oder der Inhalt ändert, Höhe neu messen
watch(() => props.hoveredConflictPoint, updatePopupHeight);
watch(() => props.position, updatePopupHeight);

// Passt die Position des Popups an, sodass es nicht über den unteren Bildschirmrand hinausragt
// TODO: In der If Anweisung steht gerade noch +120, da die positionen aus den props nicht die Positionen des gesamten Viewports sind, sondern die vom Canvas -> Hier sollte noch eine dynamische Lösung gesucht werden
const adjustedPosition = computed(() => {
  let top = props.position.y;
  const left = props.position.x;
  const viewportHeight = window.innerHeight;

  if (top + 120 + popupHeight.value > viewportHeight) {
    console.log(top);
    top = props.position.y - popupHeight.value - 10;
  }

  return { x: left, y: top };
});

</script>

<template>
  <div
    ref="popupRef"
    class="popup"
    :style="{ top: `${adjustedPosition.y}px`, left: `${adjustedPosition.x}px` }"
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
