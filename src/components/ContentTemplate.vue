<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
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

// for highlights
const route = useRoute()
const highlightedConflictId = route.query.conflictId

/**
 * Computes a filtered list of conflicts specific to the current page.
 * Filters conflicts based on whether their participants include the current page's ID
 * which leads to the fitting conflicts being displayed.
 * 
 * @returns {Array} An array of conflicts relevant to the current page context
 */
const filteredConflicts = computed(() => {
  // with the higlighted conflict on top
  const conflicts = conflictStore.getConflicts.filter(conflict => {
    return Array.isArray(conflict.participants) &&
      conflict.participants.some(participant => participant.type === props.pageData.id);
  });

  // If there is a highlightedConflictId, sort so it comes first
  if (highlightedConflictId) {
    return conflicts.slice().sort((a, b) => {
      if (a.id === highlightedConflictId) return -1;
      if (b.id === highlightedConflictId) return 1;
      return 0;
    });
  }
  return conflicts;
  // old:
  /*return conflictStore.getConflicts.filter(conflict => {
    return Array.isArray(conflict.participants) &&
      conflict.participants.some(participant => participant.type === props.pageData.id);
  });*/
});

</script>

<template>
  <!-- Check if there are any filtered conflicts to display -->
  <div v-if="filteredConflicts.length > 0">
    <div v-for="conflict in filteredConflicts" :key="conflict.id">
      <div class="conflict-container">
        <div class="note-container">
          <!-- NoteCard component for displaying conflict details -->
          <NoteCard :conflict="conflict"
            :title="conflict.title[sessionStore.activeLanguage] || conflict.title['default']"
            :content="conflict.description[sessionStore.activeLanguage] || conflict.description['default']"
            :origin="conflict.origin"
            :author="conflict.author.labels?.[sessionStore.activeLanguage] || 
                     conflict.author.labels?.['default'] || 
                     Object.values(conflict.author.labels || {}).find(label => typeof label === 'string' && label.trim() !== '') || 
                     conflict.author.id || ''"
            :authorId="conflict.author.id"
            :status="conflict.status" :isGrayedOut="!!highlightedConflictId && conflict.id !== highlightedConflictId" />
        </div>

      </div>
    </div>
  </div>

  <!-- Display a message if there are no conflicts -->
  <div v-else>
    <p>{{ staticContent.errors.noConflicts[sessionStore.activeLanguage] }}</p>
  </div>
</template>


<style scoped>
/* Container styling for each conflict */
.conflict-container {
  padding-bottom: 20px;
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
