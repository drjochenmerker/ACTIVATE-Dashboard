<script lang="ts" setup>
import { ref, computed, toRaw, onMounted } from 'vue';
import NoteCard from './NoteCard.vue';
import ReplyCard from './ReplyCard.vue';
import { addComment } from "@/data/knowledge_graph/write_operations";
import { Button } from '@/components/ui/button';
import { useConflictsStore } from '@/stores/conflictsStore';
import { storeToRefs } from 'pinia';

//todo hard coded graph title
const graph = 'Urology_Emergency_after_Debriefing';

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

// visibility of comment-input field per conflict
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});

// toggle input field
const toggleReplyInput = (conflictId: string) => {
  replyInputVisible.value[conflictId] = !replyInputVisible.value[conflictId];
  if (!replyInputVisible.value[conflictId]) {
    newReplyText.value[conflictId] = ''; // Textfeld leeren, wenn es geschlossen wird
  }
};

const saveReply = async (conflictId: string) => {
  console.log(`save comment for conlfict with id: ${conflictId}:`, newReplyText.value[conflictId]);

  if (!newReplyText.value[conflictId]) return;

  try {
    // SPARQL query to save the comment (reply)
    const response = await addComment(
      graph, // current knowledge graph
      conflictId, // id of the conflict
      "test-replyer", // TODO Temporärer Hardcoded-Autor
      newReplyText.value[conflictId] // reply text
    );

    console.log("Kommentar erfolgreich gespeichert:", response);

    // add new reply in UI
    const conflict = filteredConflicts.value.find(c => c.id === conflictId);
    if (conflict) {
      conflict.replies = conflict.replies || []; // Falls replies noch nicht existiert
      conflict.replies.push({
        id: Date.now().toString(), // TODO Temporäre ID für die UI
        author: "test-replyer", // TODO Temporärer Hardcoded-Autor
        comment: newReplyText.value[conflictId]
      });
    }
    replyInputVisible.value[conflictId] = false;
    newReplyText.value[conflictId] = '';
  } catch (error) {
    console.error("error saving comment:", error);
  }
  // set visibility of comment-input field to false
  replyInputVisible.value[conflictId] = false;
  newReplyText.value[conflictId] = '';

  console.log("saved ");
};

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
    <div v-for="(conflict, index) in filteredConflicts" :key="conflict.id">
      <div class="conflict-container">
        <div class="note-container">
          <NoteCard :conflict="conflict" :title="conflict.title" :content="conflict.description"
            :author="conflict.author" :status="conflict.status" />
          <div class="note-comment-section">
            <Button @click="toggleReplyInput(conflict.id)"> Add comment </Button>
          </div>
          <!-- comment input field -->
          <div v-if="replyInputVisible[conflict.id]" class="comment-input">
            <textarea v-model="newReplyText[conflict.id]" placeholder="Write a reply..." />
            <Button @click="saveReply(conflict.id)">Save</Button>
          </div>
        </div>

        <!-- Anzeige der Replies zu einem Konflikt -->
        <div v-if="conflict.replies && conflict.replies.length > 0" class="reply-container">
          <div v-for="(reply, replyIndex) in conflict.replies" :key="reply.id">
            <ReplyCard :key="reply.id" :conflictReply="reply" />
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
