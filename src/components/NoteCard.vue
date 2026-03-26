<script lang="ts" setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import DOMPurify from 'dompurify';
import { conflictPredicate, conflictStatus, ConflictWithId, Participant } from '@/data/knowledge_graph/structures';
import ReplyCard from './ReplyCard.vue';
import { addComment, deleteConflict, updateConflict } from "@/data/knowledge_graph/write_operations";
import { ButtonComponent } from '@/components/ui/button';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { activateTerms, staticContent } from '@/data/contentData';
import { buildLanguageString } from '@/lib/utils';
import { LanguageCode } from '@/data/knowledge_graph/structures'
import DeletionPopUp from './DeletionPopUp.vue';
import ConflictEditDialog from './ui/dialog/ConflictEditDialog.vue';

const props = defineProps<{
    conflict: ConflictWithId;
    title: string;
    content: string;
    origin: string;
    author: string;
    authorId: string;
    status: string;
    isGrayedOut: boolean;
}>();

/** 
 * Reactive references for managing conflict details and reply input state
 * - conflictDetail: Stores the current conflict's details
 * - replyInputVisible: Tracks visibility of reply input for each conflict
 * - newReplyText: Stores temporary reply text for each conflict
 */
const conflictDetail = ref<ConflictWithId | null>(null);
// todo
// const isShowOriginOpen = ref(false);
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});

// Set status from props
const selectedStatus = ref<string>(props.status);

// Stores for the conflicts and the session
const conflictStore = useConflictsStore();
const sessionStore = useSessionStore();


const textareaRef = ref<HTMLTextAreaElement | null>(null);
const editDialogRef = ref<InstanceType<typeof ConflictEditDialog> | null>(null);

// Sanitize HTML content to prevent XSS attacks
const sanitizedTitle = computed(() => DOMPurify.sanitize(props.title || ''));
const sanitizedContent = computed(() => DOMPurify.sanitize(props.content || ''));

// Set initial conflict detail
onMounted(() => {
  conflictDetail.value = { ...props.conflict };
});

// Watcher for props.conflict that adds the new conflict
watch(() => props.conflict, (newConflict) => {
  conflictDetail.value = { ...newConflict };
}, { deep: true });

// Watcher for the selected status that causes the update of the conflict status
watch(selectedStatus, async (newStatus) => {
  await updateConflict(sessionStore.sessionActivity!.graph, props.conflict.id ?? '', conflictPredicate.status, newStatus);
  conflictStore.updateConflict(props.conflict.id ?? '', sessionStore.sessionActivity!.graph);
});

// Toggle for the input field
const toggleReplyInput = async (conflictId: string) => {
  replyInputVisible.value[conflictId] = !replyInputVisible.value[conflictId];
  if (replyInputVisible.value[conflictId]) {
    await nextTick();
    textareaRef.value?.focus();
  }
  if (!replyInputVisible.value[conflictId]) {
    newReplyText.value[conflictId] = '';
  }
};

/**
 * Computes a grouped collection of participants by their type from the conflict.
 * Groups participants into an object where keys are participant types and values are arrays of participant IDs.
 * Returns an empty object if no participants are present.
 * Is used to show the participating parties of each conflict in the conflict card/NoteCard.
 * 
 * @returns {Record<string, string[]>} A record of participant types mapped to their corresponding participant IDs
 */
const groupedParticipants = computed(() => {
  const groups: Record<string, Participant[]> = {};
  if (!props.conflict.participants) return groups;

  props.conflict.participants.forEach((participant: Participant) => {
    if (!groups[participant.type]) {
      groups[participant.type] = [];
    }
    groups[participant.type].push(participant);
  });

  return groups;
});

/**
 * Saves a reply to a specific conflict by adding a comment and updating the UI state.
 * 
 * @param {string} conflictId - The unique identifier of the conflict to which the reply is being added
 * @returns {Promise<void>} A promise that resolves when the comment is saved and UI is updated
 */
const saveReply = async (conflictId: string) => {
  if (!newReplyText.value[conflictId]) return;

  try {
    await addComment(
      conflictId,
      newReplyText.value[conflictId] // Reply text
    );

    if (conflictDetail.value) {
      if (!conflictDetail.value.replies) {
        conflictDetail.value.replies = [];
      }
    }
    // Important to refresh the conflict list so that the UI shows the new comment immediately
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
    saveReply(props.conflict.id ?? '');
  }
};

const openEditDialog = async () => {
  editDialogRef.value?.openEditDialog();
};

/**
 * Deletes a specific conflict from the conflict store and updates the conflict list.
 * 
 * @param {string} id - The unique identifier of the conflict to be deleted
 * @returns {Promise<void>} A promise that resolves when the conflict is deleted and the list is refreshed
 */
const handleDelete = async (id: string) => {
  try {
    const response = await deleteConflict(sessionStore.sessionActivity!.graph, id);

    conflictStore.refreshConflictList(); // important to see result immediately as the conflicts are shown from the store
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

const refreshReplies = async () => {
  await conflictStore.refreshConflictList();
};


</script>

<template>
  <div class="note-card" :class="[selectedStatus, { 'grayed-out': isGrayedOut }]">
    <ConflictEditDialog
      ref="editDialogRef"
      :conflict="props.conflict"
      @saved="() => conflictStore.refreshConflictList()"
    />

    <div class="note-card-header">
      <!-- Author-->
      <span class="note-card-author">
        {{ staticContent.terms.author[sessionStore.activeLanguage] }}: {{ props.author }}
      </span>
      <!-- Status selector -->
      <div class="status-selector">
        <select v-model="selectedStatus">
          <option :value="conflictStatus.open">{{ staticContent.terms.conflictStatus.open[sessionStore.activeLanguage]
          }}</option>
          <option :value="conflictStatus.inDiscussion">{{
            staticContent.terms.conflictStatus.inDiscussion[sessionStore.activeLanguage] }}</option>
          <option :value="conflictStatus.resolved">{{
            staticContent.terms.conflictStatus.resolved[sessionStore.activeLanguage] }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <!-- Edit button -->
        <button v-if="sessionStore.instructorView" class="icon-button" @click="openEditDialog">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <!-- Delete button -->
        <DeletionPopUp
          :title="staticContent.startPage.deleteComment[sessionStore.activeLanguage]"
          :description="staticContent.startPage.deleteCommentConfirm[sessionStore.activeLanguage]"
          :author="props.author"
          :delete-function="() => handleDelete(props.conflict.id ?? '')"
        >
        </DeletionPopUp>
      </div>
    </div>

    <hr class="note-divider" />

    <div class="note-card-content">
      <!-- Note title -->
      <!-- // v-html is fine here because it's not a user input field -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="note-title" v-html="sanitizedTitle"></div>

      <!-- Participants grouped by type -->
      <div class="note-participants">
        <div v-for="(group, type) in groupedParticipants" :key="type" class="participant-group">
          <div class="participant-group-box">
            <strong class="participant-group-title">{{ activateTerms[sessionStore.activeLanguage][type] }}:</strong>
            <div class="participant-tag-container">
              <span v-for="participant in group" :key="participant.id" class="participant-tag">
                {{ buildLanguageString(participant, sessionStore.activeLanguage as LanguageCode, true) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
       <!-- // v-html is fine here because it's not a user input field -->
       <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="note-content" v-html="sanitizedContent"></div>
    </div>

    <!-- Note comment section starting with add comment button -->

    <div v-if="!replyInputVisible[conflict.id ?? '']" class="note-comment-section">
      <ButtonComponent @click="toggleReplyInput(conflict.id ?? '')">
        {{ staticContent.noteCards.addComment[sessionStore.activeLanguage] }} </ButtonComponent>
    </div>

    <div v-if="replyInputVisible[conflict.id ?? '']" class="comment-input">
      <ButtonComponent @click="toggleReplyInput(conflict.id ?? '')">
        {{ staticContent.noteCards.cancel[sessionStore.activeLanguage] }} </ButtonComponent>
      <textarea
ref="textareaRef" v-model="newReplyText[conflict.id ?? '']"
        :placeholder="staticContent.placeholders.answer[sessionStore.activeLanguage]"
        @keydown.enter="handleEnterKey($event)" />
      <ButtonComponent @click="saveReply(conflict.id ?? '')">{{ staticContent.noteCards.save[sessionStore.activeLanguage] }}</ButtonComponent>
    </div>

    <div v-if="conflictDetail && conflictDetail.replies && conflictDetail.replies.length > 0" class="reply-container">
      <ReplyCard
v-for="(reply) in conflictDetail.replies" :key="reply.id" :parent-comment="reply"
        :conflict-id="conflict.id" :show-edit="sessionStore.instructorView" @delete-comment="removeReply" @refresh="refreshReplies" />
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

.grayed-out {
  opacity: 0.5;
  pointer-events: none;
  filter: grayscale(100%);
}

.dark .note-card {
  background-color: #2b2b2b;
  border-color: #444;
  color: #e0e0e0;
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

.dark .comment-input {

  color: #1e1e1e;
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

.dark .note-card-author {
  color: #f7f7f7;
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

.dark .status-selector select {
  background-color: #1e1e1e;
  color: #ffffff;
}

.status-selector select:focus {
  outline: none;
  background-color: #f1f1f1;
}

.dark .status-selector select:focus {
  background-color: #1e1e1e;
  color: #ffffff;
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

.note-origin {
  margin-top: 10px;
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
