<script lang="ts" setup>
import { defineProps, ref, defineEmits, onMounted } from 'vue';
import { noteStatus } from '@/assets/constants/noteStatus';
import { conflictStatus } from '@/data/knowledge_graph/structures';

const props = defineProps({
  conflict: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  }
});

const emit = defineEmits(['updateStatus']);

// Funktion zur Status-Zuordnung
const mapConflictStatusToNoteStatus = (status: string) => {
  switch (status) {
    case conflictStatus.open:
      return noteStatus.RED;
    case conflictStatus.inDiscussion:
      return noteStatus.YELLOW;
    case conflictStatus.resolved:
      return noteStatus.GREEN;
    default:
      return noteStatus.RED;
  }
};

// Status aus den Props setzen
const selectedStatus = ref(mapConflictStatusToNoteStatus(props.status));

// Status in sessionStorage speichern
function saveStatusToSessionStorage(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  const noteKey = `noteStatus-${props.content}`;
  sessionStorage.setItem(noteKey, color);
}

// Status aus sessionStorage abrufen oder Standardwert setzen
onMounted(() => {
  const noteKey = `noteStatus-${props.content}`;
  const storedStatus = sessionStorage.getItem(noteKey);
  if (storedStatus && (Object.values(noteStatus) as string[]).includes(storedStatus)) {
    selectedStatus.value = storedStatus as typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN;
  }
});

// Status aktualisieren
function setStatus(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  selectedStatus.value = color;
  emit('updateStatus', selectedStatus.value);
  saveStatusToSessionStorage(color);
}
</script>

<template>
  <div class="note-card" :class="selectedStatus">
    <div class="note-card-header">
      <!-- show author -->
      <span class="note-card-author">
        {{ props.author }}
      </span>
      <div class="status-selector">
        <!-- drop down for status selection -->
        <select v-model="selectedStatus" @change="setStatus(selectedStatus)">
          <option :value="noteStatus.RED">{{ conflictStatus.open }}</option>
          <option :value="noteStatus.YELLOW">{{ conflictStatus.inDiscussion }}</option>
          <option :value="noteStatus.GREEN">{{ conflictStatus.resolved }}</option>
        </select>
      </div>
    </div>

    <!-- line break -->
    <hr class="note-divider" />

    <!-- content -->
    <div class="note-card-content">
      <div class="note-title" v-html="props.title"></div>
      <div class="note-content" v-html="props.content"></div>
    </div>
  </div>
</template>

<style scoped>
.note-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  width: 100%;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

/* Dynamische Farben basierend auf Status */
.note-card.red {
  box-shadow: 0 2px 8px rgba(255, 182, 193, 0.5);
  border-color: rgba(255, 182, 193, 0.7);
}

.note-card.yellow {
  box-shadow: 0 2px 8px rgba(253, 253, 150, 0.5);
  border-color: rgba(253, 253, 150, 0.7);
}

.note-card.green {
  box-shadow: 0 2px 8px rgba(152, 251, 152, 0.5);
  border-color: rgba(152, 251, 152, 0.7);
}

/* Header */
.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

/* Autor */
.note-card-author {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

/* Dropdown */
.status-selector select {
  padding: 5px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #ccc;
  transition: background-color 0.2s ease;
}

.status-selector select:focus {
  outline: none;
  background-color: #f1f1f1;
}

.note-divider {
  border: none;
  border-top: 1px solid #ddd;
  margin: 10px 0;
}

/* Inhalt */
.note-card-content {
  margin-bottom: 10px;
}

.note-title {
  font-weight: bold;
}

.note-content {
  font-weight: normal;
}
</style>
