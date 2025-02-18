<script lang="ts" setup>
import { defineProps, ref, defineEmits, onMounted } from 'vue';
import { noteStatus } from '@/assets/constants/noteStatus';
import { Button } from '@/components/ui/button';

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

// Initialize the status with a default value: noteStatus.RED
const selectedStatus = ref<typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN>(noteStatus.RED);

// Function to save the status in sessionStorage
function saveStatusToSessionStorage(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  const noteKey = `noteStatus-${props.content}`; // Key of that note
  sessionStorage.setItem(noteKey, color); // Save the status in sessionStorage
}

onMounted(() => {
  const noteKey = `noteStatus-${props.content}`; // Key of that note
  const storedStatus = sessionStorage.getItem(noteKey);
  if (storedStatus && Object.values(noteStatus).includes(storedStatus)) {
    selectedStatus.value = storedStatus as typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN;
  } else {
    // If there is no stored status, set the default value: noteStatus.RED
    selectedStatus.value = noteStatus.RED;
  }
});

// Change status and pass it to the parent component
function setStatus(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  selectedStatus.value = color;
  emit('updateStatus', selectedStatus.value);
  
  // Save the status in sessionStorage
  saveStatusToSessionStorage(color);
}
</script>

<template>
  <div class="note-card" :class="selectedStatus">
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
    <div class="note-comment-section">
      <Button> Add comment </Button>
    </div>
  </div>
</template>

<style scoped>
/* General styling */
.note-card {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 1000px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

/* Dynamic shadow colors based on the selected status */
.note-card.red {
  box-shadow: 0 2px 8px rgba(255, 182, 193, 0.5); /* Pastel Pink */
  border-color: rgba(255, 182, 193, 0.7);
}

.note-card.yellow {
  box-shadow: 0 2px 8px rgba(253, 253, 150, 0.5); /* Pastel Yellow */
  border-color: rgba(253, 253, 150, 0.7);
}

.note-card.green {
  box-shadow: 0 2px 8px rgba(152, 251, 152, 0.5); /* Pastel Green */
  border-color: rgba(152, 251, 152, 0.7);
}

/* Header styling */
.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  align-items: center;
  gap: 10px;
}

.note-card-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  border-radius: 20px;
}

.note-card-status.anonymous {
  background-color: #c6c6c6;
}

.note-card-status:not(.anonymous) {
  background-color: #0000009d;
  
}

/* Status point selector */
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
  background-color: #ffb6c1; /* Pastel Pink */
}

.status-dot.yellow {
  background-color: #fdfd96; /* Pastel Yellow */
}

.status-dot.green {
  background-color: #98fb98; /* Pastel Green */
}

.status-dot.selected {
  border: 2px solid black;
}

.note-card-content {
  margin-bottom: 10px;
  /*background-color: #ffffff2f;*/
}
</style>
