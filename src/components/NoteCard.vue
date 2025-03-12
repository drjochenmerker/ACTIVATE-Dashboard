<script lang="ts" setup>
import { defineProps, ref, defineEmits, onMounted } from 'vue';
import { noteStatus } from '@/assets/constants/noteStatus';
import { conflictStatus } from '@/data/knowledge_graph/structures';
import ReplyCard from './ReplyCard.vue';
import { addComment } from "@/data/knowledge_graph/write_operations";
import { Button } from '@/components/ui/button';

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

// visibility of comment-input field per conflict
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});

//todo hard coded graph title
const graph = 'Urology_Emergency_after_Debriefing';

const emit = defineEmits(['updateStatus']);

// Funktion zur Status-Zuordnung
const mapConflictStatusToNoteStatus = (status: string) => {
  switch (status) {
    case conflictStatus.open:
      return noteStatus.RED;
    case conflictStatus.inDiscussion:
      return noteStatus.YELLOW;
    case conflictStatus.resolved:
      return noteStatus.GREEN;
    default:
      return noteStatus.RED;
  }
};

// Status aus den Props setzen
const selectedStatus = ref(mapConflictStatusToNoteStatus(props.status));

// Status in sessionStorage speichern
function saveStatusToSessionStorage(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  const noteKey = `noteStatus-${props.content}`;
  sessionStorage.setItem(noteKey, color);
}

// Status aus sessionStorage abrufen oder Standardwert setzen
onMounted(() => {
  const noteKey = `noteStatus-${props.content}`;
  const storedStatus = sessionStorage.getItem(noteKey);
  if (storedStatus && Object.values(noteStatus).includes(storedStatus as typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN)) {
    selectedStatus.value = storedStatus as typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN;
  }
});

// Status aktualisieren
function setStatus(color: typeof noteStatus.RED | typeof noteStatus.YELLOW | typeof noteStatus.GREEN) {
  selectedStatus.value = color;
  emit('updateStatus', selectedStatus.value);
  saveStatusToSessionStorage(color);
  console.log("Mens")
}

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
    const conflict = props.conflict;
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
          <option :value="noteStatus.RED">{{ conflictStatus.open }}</option>
          <option :value="noteStatus.YELLOW">{{ conflictStatus.inDiscussion }}</option>
          <option :value="noteStatus.GREEN">{{ conflictStatus.resolved }}</option>
        </select>
      </div>
    </div>

    <!-- line break -->
    <hr class="note-divider" />

    <!-- content -->
    <div class="note-card-content">
      <div class="note-title" v-html="props.title"></div>
      <div class="note-content" v-html="props.content"></div>
    </div>
    <div class="note-comment-section">
    <Button @click="toggleReplyInput(conflict.id)"> Add comment </Button>
  </div>
  <!-- comment input field -->
  <div v-if="replyInputVisible[conflict.id]" class="comment-input">
    <textarea v-model="newReplyText[conflict.id]" placeholder="Write a reply..." />
    <Button @click="saveReply(conflict.id)">Save</Button>
  </div>
  <!-- Anzeige der Replies zu einem Konflikt -->
  <div v-if="conflict.replies && conflict.replies.length > 0" class="reply-container">
    <div v-for="(reply) in conflict.replies" :key="reply.id">
      <ReplyCard :key="reply.id" :conflictReply="reply" />
    </div>
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

/* Dynamische Farben basierend auf Status */
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

/* Header */
.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

/* Autor */
.note-card-author {
  font-size: 14px;
  font-weight: bold;
  color: #333;
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

/* Inhalt */
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
