<script lang="ts" setup>
import { computed, toRaw } from 'vue';
import NoteCard from './NoteCard.vue';

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
  conflicts: {
    type: Object,
    required: true,
  },
});

//filtered conflicts based on id of "pageData"
const filteredConflicts = computed(() => {
  return toRaw(props.conflicts).filter((conflict: { participants: any[] }) => {
    return Array.isArray(conflict.participants) &&
      conflict.participants.some(participant => participant.type === props.pageData.id);
  });
});
</script>

<template>
  <div v-if="filteredConflicts.length > 0">
    <div v-for="(conflict) in filteredConflicts" :key="conflict.id">
      <div class="conflict-container">
        <div class="note-container">
          <NoteCard :conflict="conflict" :title="conflict.title" :content="conflict.description"
            :author="conflict.author" :status="conflict.status" />
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <p>There are no conflicts.</p>
  </div>
</template>

<style scoped>
.conflict-container {
  margin-bottom: 20px;
}

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
