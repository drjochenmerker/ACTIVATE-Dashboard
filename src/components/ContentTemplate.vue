<script lang="ts" setup>
import { ref, onMounted, toRaw } from 'vue';
import NoteCard from './NoteCard.vue';
import ReplyCard from './ReplyCard.vue';
import { Button } from '@/components/ui/button';

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

const notes = ref<any[]>([]);
const filteredNotes = ref<any[]>([]);

onMounted(() => {
  console.log('Participants: ', toRaw(props.conflicts).participants);
  //notes.value = JSON.parse(sessionStorage.getItem('notes') || '[]');
  //filterNotesBySelectedPoint();
});




const filterNotesBySelectedPoint = () => {
  const participants = toRaw(props.conflicts).participants
  // Filter nach dem `participatingPoints`
  filteredNotes.value = notes.value.filter(note =>
    Array.isArray(note.participatingPoints) &&
    note.participatingPoints.includes(props.pageData.number)
  );
};

</script>

<template>

  <div v-if="props.conflicts.length > 0">
    <div v-for="(conflict, index) in conflicts" :key="conflict.id">
      <div class="conflict-container">
        <div class="note-container">
          <NoteCard :conflict="conflict" :title="conflict.title" :content="conflict.description"
            :author="conflict.author" :status="conflict.status" />
          <div class="note-comment-section">
            <Button> Add comment </Button>
          </div>
        </div>
        <div class="reply-container">
          <ReplyCard :conflictReply="conflict.replies" />
        </div>
      </div>
    </div>
  </div>

  <div v-else>
    <p>Es gibt keine Notizen für diese Seite.</p>
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
