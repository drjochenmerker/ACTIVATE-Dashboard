<script lang="ts" setup>
import { defineProps, ref, onMounted, nextTick, computed, watch } from 'vue';
import { conflictPredicate, conflictStatus } from '@/data/knowledge_graph/structures';
import ReplyCard from './ReplyCard.vue';
import { addComment, deleteConflict, updateConflict } from "@/data/knowledge_graph/write_operations";
import { Button } from '@/components/ui/button';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';

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


// Set status from props
const selectedStatus = ref<any>(props.status);

const conflictStore = useConflictsStore();
const sessionStore = useSessionStore();


const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Set initial conflict detail
onMounted(() => {
  conflictDetail.value = { ...props.conflict };
});

// watch for props.conflict in case it changes externally (e.g. through store updates)
watch(() => props.conflict, (newConflict) => {
  conflictDetail.value = { ...newConflict };
}, { deep: true });


// watch the selected status and update the conflict status
watch(selectedStatus, async (newStatus) => {
  await updateConflict(sessionStore.sessionActivity!.graph, props.conflict.id, conflictPredicate.status, newStatus);
  conflictStore.updateConflict(props.conflict.id, sessionStore.sessionActivity!.graph);
});

// toggle input field
const toggleReplyInput = async (conflictId: string) => {
  replyInputVisible.value[conflictId] = !replyInputVisible.value[conflictId];
  if (replyInputVisible.value[conflictId]) {
    await nextTick();
    textareaRef.value?.focus();
  }
  if (!replyInputVisible.value[conflictId]) {
    newReplyText.value[conflictId] = ''; // Textfeld leeren
  }
};

// Grouped participants to see which participants are included in the conflict
const groupedParticipants = computed(() => {
  const groups: Record<string, string[]> = {};
  if (!props.conflict.participants) return groups;

  props.conflict.participants.forEach((participant: { type: string | number; id: string; }) => {
    if (!groups[participant.type]) {
      groups[participant.type] = [];
    }
    groups[participant.type].push(participant.id);
  });

  return groups;
});

// Function to save a reply to a conflict
const saveReply = async (conflictId: string) => {
  const graph = sessionStore.sessionActivity!.graph;
  const role = sessionStore.sessionRole!;
  if (!newReplyText.value[conflictId]) return;

  try {
    await addComment(
      graph,
      conflictId,
      role,
      newReplyText.value[conflictId] // reply text
    );

    if (conflictDetail.value) {
      if (!conflictDetail.value.replies) {
        conflictDetail.value.replies = [];
      }
    }
    useConflictsStore().refreshConflictList();
    replyInputVisible.value[conflictId] = false;
    newReplyText.value[conflictId] = '';
  } catch (error) {
    console.error("Error saving comment: ", error);
  }
};

// Function to submit via Enter key in textarea
const handleEnterKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    saveReply(props.conflict.id);
  }
};

// Delete conflict
const handleDelete = async (id: string) => {
  try {
    const response = await deleteConflict(sessionStore.sessionActivity!.graph, id);

    conflictStore.refreshConflictList();
    if (response.status === "OK") {
      conflictStore.removeConflict(id); // delete conflict from store
    }
  } catch (error) {
    console.error("Error deleting conflict: ", error);
  }
};

const removeReply = (id: string) => {
  if (conflictDetail.value && conflictDetail.value.replies) {
    conflictDetail.value.replies = conflictDetail.value.replies.filter((reply: { id: string; }) => reply.id !== id);
  }
};


</script>

<template>
  <div class="note-card" :class="selectedStatus">
    <div class="note-card-header">
      <!-- Author-->
      <span class="note-card-author">
        Author: {{ props.author }}
      </span>
      <!-- Status selector -->
      <div class="status-selector">
        <select v-model="selectedStatus">
          <option :value="conflictStatus.open">{{ conflictStatus.open }}</option>
          <option :value="conflictStatus.inDiscussion">{{ conflictStatus.inDiscussion }}</option>
          <option :value="conflictStatus.resolved">{{ conflictStatus.resolved }}</option>
        </select>
      </div>
      <!-- Delete button -->
      <button class="icon-button" @click="handleDelete(props.conflict.id)">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>

    <hr class="note-divider" />

    <div class="note-card-content">
      <!-- Note title -->
      <div class="note-title" v-html="props.title"></div>

      <!-- Participants grouped by type -->
      <div class="note-participants">
        <div v-for="(group, type) in groupedParticipants" :key="type" class="participant-group">
          <div class="participant-group-box">
            <strong class="participant-group-title">{{ type }}:</strong>
            <div class="participant-tag-container">
              <span v-for="id in group" :key="id" class="participant-tag">
                {{ id }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="note-content" v-html="props.content"></div>
    </div>

    <!-- Note comment section starting with add comment button -->
    <div class="note-comment-section">
      <Button @click="toggleReplyInput(conflict.id)"> Add comment </Button>
    </div>

    <div v-if="replyInputVisible[conflict.id]" class="comment-input">
      <textarea ref="textareaRef" v-model="newReplyText[conflict.id]" placeholder="Write a reply..."
        @keydown.enter="handleEnterKey($event)" />
      <Button @click="saveReply(conflict.id)">Save</Button>
    </div>

    <div v-if="conflictDetail && conflictDetail.replies && conflictDetail.replies.length > 0" class="reply-container">
      <ReplyCard v-for="(reply) in conflictDetail.replies" :key="reply.id" :parentComment="reply"
        :conflictId="conflict.id" @deleteComment="removeReply" />
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

/* icon */
.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 24px;
  color: red;
}

.icon-button:hover {
  color: darkred;
}

/* comment input */
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
  gap: 10px;
  margin-bottom: 10px;
}

.participant-group-box {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 150px;
}

.participant-group-title {
  font-size: 14px;
  font-weight: bold;
  color: #444;
}

.participant-tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.participant-tag {
  background-color: #e0e0e0;
  color: #333;
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
