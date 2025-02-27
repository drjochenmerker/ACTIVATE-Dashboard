<script lang="ts" setup>
import { ref, onMounted, toRaw, computed } from 'vue';
import NoteCard from './NoteCard.vue';
import ReplyCard from './ReplyCard.vue';
import { Button } from '@/components/ui/button';
import { contentData } from '@/data/contentData';
import { types } from 'util';
import { getConflictDetail, getConflictIds } from '@/data/knowledge_graph/read_operations';

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


const filteredConflicts = computed(() => {
  return toRaw(props.conflicts).filter((conflict: { participants: any[]; }) => {
    if (!Array.isArray(conflict.participants)) return false;
    return conflict.participants.some(participant => participant.type === props.pageData.id);
  });
});
onMounted(() => {
  //filterNotesBySelectedPoint();
});


</script>

<template>
  <div v-if="filteredConflicts.length > 0">
    <div v-for="(conflict, index) in filteredConflicts" :key="conflict.id">
      <div class="conflict-container">
        <div class="note-container">
          <NoteCard :conflict="conflict" :title="conflict.title" :content="conflict.description"
            :author="conflict.author" :status="conflict.status" />
          <div class="note-comment-section">
            <Button> Add comment </Button>
          </div>
        </div>
        <div class="reply-container">
          <div v-for="(reply, replyIndex) in conflict.replies" :key="reply.id">
            <ReplyCard :conflictReply="reply" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <p>There are no conflicts.</p>
  </div>
</template>

<style scoped>
.conflicts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.conflict-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.note-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.note-comment-section {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.comment-button {
  background-color: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.comment-button:hover {
  background-color: #0056b3;
}

.reply-container {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>
