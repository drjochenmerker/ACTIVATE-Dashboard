<script lang="ts" setup>
import { computed } from 'vue';
import NoteCard from './NoteCard.vue';
import { useConflictsStore } from '@/stores/conflictsStore';
import { staticContent } from '@/data/contentData';
import { useSessionStore } from '@/stores/sessionStore';

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

// Store for conflicts
const conflictStore = useConflictsStore();
const sessionStore = useSessionStore();

/**
 * Computes a filtered list of conflicts specific to the current page.
 * Filters conflicts based on whether their participants include the current page's ID
 * which leads to the fitting conflicts being displayed.
 * 
 * @returns {Array} An array of conflicts relevant to the current page context
 */
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
    <p>{{staticContent.errors.noConflicts[sessionStore.activeLanguage]}}</p>
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
