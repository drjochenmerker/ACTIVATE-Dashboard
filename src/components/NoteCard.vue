<script lang="ts" setup>
import { defineProps, ref, defineEmits, onMounted } from 'vue';
import { noteStatus } from '@/assets/constants/noteStatus';

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['updateStatus']);

// Initialising of the status with default value: noteStatus.RED
const selectedStatus = ref<typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN>(noteStatus.RED);

// function to save the status in sessionStorage
// TODO: sparql query to set the status to the database
function saveStatusToSessionStorage(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  const noteKey = `noteStatus-${props.content}`; // key of that note
  sessionStorage.setItem(noteKey, color); // save the status in sessionStorage
}


onMounted(() => {
  const noteKey = `noteStatus-${props.content}`; // key of that note
  const storedStatus = sessionStorage.getItem(noteKey);
  if (storedStatus && Object.values(noteStatus).includes(storedStatus)) {
    selectedStatus.value = storedStatus as typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN;
  } else {
    // If there is no stored status, set the default value: noteStatus.RED
    selectedStatus.value = noteStatus.RED;
  }
});

// change status and pass it to the parent component
function setStatus(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  selectedStatus.value = color;
  emit('updateStatus', selectedStatus.value);
  
  // Save the status in sessionStorage
  // TODO: sparql query to send the status to the database
  saveStatusToSessionStorage(color);
  
}
</script>

<template>
  <div class="note-card">
    <div class="note-card-header">
      <span class="note-card-status" :class="{ 'anonymous': props.isAnonymous }">
        {{ props.isAnonymous ? 'Anonymous' : 'Not Anonymous' }}
      </span>
      <div class="status-selector">
        <button
          v-for="color in [noteStatus.RED, noteStatus.YELLOW, noteStatus.GREEN]"
          :key="color"
          :class="['status-dot', color, { selected: selectedStatus === color }]"
          @click="setStatus(color)"
          aria-label="Status auswählen"
        ></button>
      </div>
    </div>
    <div class="note-card-content">
      <div v-html="props.content"></div>
    </div>
  </div>
</template>

<style scoped>
/* general styling */
.note-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
}

.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.note-card-status {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
}

.note-card-status.anonymous {
  background-color: #888;
}

.note-card-status:not(.anonymous) {
  background-color: #4caf50;
}

/* status point selector styling */
.status-selector {
  display: flex;
  gap: 8px;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.status-dot:hover {
  transform: scale(1.2);
}

.status-dot.red {
  background-color: red;
}

.status-dot.yellow {
  background-color: yellow;
}

.status-dot.green {
  background-color: green;
}

.status-dot.selected {
  border: 2px solid black;
}
</style>
