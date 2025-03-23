<script lang="ts" setup>
import { defineProps, ref, onMounted, nextTick } from 'vue';
import { conflictPredicate, conflictStatus } from '@/data/knowledge_graph/structures';
import ReplyCard from './ReplyCard.vue';
import { addComment, updateConflict } from "@/data/knowledge_graph/write_operations";
import { Button } from '@/components/ui/button';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useActivityStore } from '@/stores/activityStore';

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

const conflictDetail = ref<any>(null);
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});

const graph = useActivityStore().getActivity()!.graph;

// Status aus den Props setzen
const selectedStatus = ref<any>(null);

const conflictStore = useConflictsStore();
const activityStore = useActivityStore();

const textareaRef = ref<HTMLTextAreaElement | null>(null)

// get status from sessionStorage or set default value
onMounted(async () => {
  const detail = props.conflict

  if (!detail.replies) {
    detail.replies = []
  }
  conflictDetail.value = detail;
  selectedStatus.value = conflictDetail.value.status;
});

// refresh status
function setStatus(status: conflictStatus) {
  selectedStatus.value = status;
  updateConflict(graph, props.conflict.id, conflictPredicate.status, selectedStatus.value)
  conflictStore.updateConflict(props.conflict.id, graph)
}

// toggle input field
const toggleReplyInput = async (conflictId: string) => {
  replyInputVisible.value[conflictId] = !replyInputVisible.value[conflictId];
  if (replyInputVisible.value) {
    await nextTick();
    textareaRef.value?.focus();
  }
  if (!replyInputVisible.value[conflictId]) {
    newReplyText.value[conflictId] = ''; // Textfeld leeren, wenn es geschlossen wird
  }
};

const saveReply = async (conflictId: string) => {
  if (!newReplyText.value[conflictId]) return;

  try {
    // SPARQL query to save the comment (reply)
    const response = await addComment(
      graph, // current knowledge graph
      conflictId, // id of the conflict
      activityStore.getRole()!,
      newReplyText.value[conflictId] // reply text
    );

    console.log("Kommentar erfolgreich gespeichert:", response);

    if (conflictDetail.value) {
      // if replies not initialized, initialize
      if (!conflictDetail.value.replies) {
        conflictDetail.value.replies = [];
      }
      conflictDetail.value.replies.push({
        id: Date.now().toString(), // temporäre ID
        author: activityStore.getRole()!,
        comment: newReplyText.value[conflictId],
        replies: [] // empty array for potential nested replies
      });
    }
    replyInputVisible.value[conflictId] = false;
    newReplyText.value[conflictId] = '';
  } catch (error) {
    console.error("Error saving comment:", error);
  }
};

const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    saveReply(props.conflict.id);
  }
};
</script>

<template>
  <div class="note-card" :class="selectedStatus">
    <div class="note-card-header">
      <!-- show author -->
      <span class="note-card-author">
        Author: {{ props.author }}
      </span>
      <div class="status-selector">
        <!-- drop down for status selection -->
        <select v-model="selectedStatus" @change="setStatus(selectedStatus)">
          <option :value="conflictStatus.open">{{ conflictStatus.open }}</option>
          <option :value="conflictStatus.inDiscussion">{{ conflictStatus.inDiscussion }}</option>
          <option :value="conflictStatus.resolved">{{ conflictStatus.resolved }}</option>
        </select>
      </div>
    </div>

    <!-- line break -->
    <hr class="note-divider" />

    <!-- content -->
    <div class="note-card-content">
      <div class="note-title" v-html="props.title"></div>
      <div class="note-participants">
        <span v-for="participant in props.conflict.participants" :key="participant.id" class="participant-tag">
          {{ participant.id }}
        </span>
      </div>



      <div class="note-content" v-html="props.content"></div>

    </div>
    <div class="note-comment-section">
      <Button @click="toggleReplyInput(conflict.id)"> Add comment </Button>
    </div>
    <!-- comment input field -->
    <div v-if="replyInputVisible[conflict.id]" class="comment-input">
      <textarea ref="textareaRef" v-model="newReplyText[conflict.id]" placeholder="Write a reply..."
        @keydown.enter="handleEnterKey($event)" />
      <Button @click="saveReply(conflict.id)">Save</Button>
    </div>
    <!-- Anzeige der Replies zu einem Konflikt -->
    <div v-if="conflictDetail && conflictDetail.replies && conflictDetail.replies.length > 0" class="reply-container">
      <ReplyCard v-for="(reply) in conflictDetail.replies" :key="reply.id" :parentComment="reply"
        :conflictId=conflict.id />
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

/* dynamic colors based on status */
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

.comment-input {
  margin-top: 10px;
}

.comment-input textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
}

/* Header */
.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

/* Author */
.note-card-author {
  font-size: 14px;
  font-weight: bold;
  color: #333;
}

/* participants */
.note-participants {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.participant-tag {
  background-color: #e0e0e0;
  /* Helles Grau */
  color: #333;
  /* Dunklere Schrift für besseren Kontrast */
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  text-transform: capitalize;
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

/* Content */
.note-card-content {
  margin-bottom: 10px;
}

.note-title {
  font-size: xx-large;
  font-weight: normal;
}

.note-content {
  font-weight: normal;

}
</style>
