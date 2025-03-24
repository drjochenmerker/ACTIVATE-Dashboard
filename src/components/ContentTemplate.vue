<script lang="ts" setup>

import { computed } from 'vue';
import { useConflictsStore } from '@/stores/conflictsStore';
import NoteCard from './NoteCard.vue';

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
  conflicts: {
    type: Array,
    required: true,
  },
});

const conflictStore = useConflictsStore();

// Computed property that dynamically filters conflicts based on the pageData ID.
// This ensures that only relevant conflicts are displayed.
const filteredConflicts = computed(() => {
  return conflictStore.getConflicts.filter(conflict => {
    return Array.isArray(conflict.participants) &&
      conflict.participants.some(participant => participant.type === props.pageData.id);
  });
});

</script>

<template>
  <!-- Check if there are any filtered conflicts to display -->
  <div v-if="filteredConflicts.length > 0">
    <div v-for="conflict in filteredConflicts" :key="conflict.id">
      <div class="conflict-container">
        <div class="note-container">
          <!-- NoteCard component for displaying conflict details -->
          <NoteCard :conflict="conflict" :title="conflict.title" :content="conflict.description || ''"
            :author="conflict.author" :status="conflict.status" />

        </div>
      </div>
    </div>
  </div>

  <!-- Display a message if there are no conflicts -->
  <div v-else>
    <p>There are no conflicts.</p>
  </div>
</template>

<style scoped>
/* Container styling for each conflict */
.conflict-container {
  margin-bottom: 20px;
}

/* Styling for the comment section */
.note-comment-section {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

/* Styling for the comment input field */
.comment-input {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-input textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
}
</style>
