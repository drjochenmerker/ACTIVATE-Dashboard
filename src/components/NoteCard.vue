<script lang="ts" setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { conflictPredicate, conflictStatus, KnowledgeGraphActivityClass, Participant, RDFOperation } from '@/data/knowledge_graph/structures';
import ReplyCard from './ReplyCard.vue';
import { addComment, deleteConflict, updateConflict, updateConflictText, updateConflictParticipants } from "@/data/knowledge_graph/write_operations";
import { Button } from '@/components/ui/button';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { activateTerms, staticContent } from '@/data/contentData';
import { buildLanguageString } from '@/lib/utils';
import { getActivityClassIds } from '@/data/knowledge_graph/read_operations';
import ConfirmDiscardDialog from './ConfirmDiscardDialog.vue';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  origin: {
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
  },
  isGrayedOut: {
    type: Boolean,
    default: false,
  }
});

/** 
 * Reactive references for managing conflict details and reply input state
 * - conflictDetail: Stores the current conflict's details
 * - replyInputVisible: Tracks visibility of reply input for each conflict
 * - newReplyText: Stores temporary reply text for each conflict
 */
const conflictDetail = ref<any>(null);
// todo
// const isShowOriginOpen = ref(false);
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});

const isEditDialogOpen = ref(false);
const isDiscardDialogOpen = ref(false);
const isParticipantRequiredOpen = ref(false);
const editedTitle = ref('');
const editedDescription = ref('');
const originalTitle = ref('');
const originalDescription = ref('');
const classOrder: KnowledgeGraphActivityClass[] = [
  KnowledgeGraphActivityClass.subject,
  KnowledgeGraphActivityClass.object,
  KnowledgeGraphActivityClass.rules,
  KnowledgeGraphActivityClass.instruments,
  KnowledgeGraphActivityClass.divison_of_labour,
  KnowledgeGraphActivityClass.community,
];

const classKeyMap: Record<KnowledgeGraphActivityClass, keyof typeof activateTerms[typeof sessionStore.activeLanguage]> = {
  [KnowledgeGraphActivityClass.subject]: 'subject',
  [KnowledgeGraphActivityClass.object]: 'object',
  [KnowledgeGraphActivityClass.rules]: 'rules',
  [KnowledgeGraphActivityClass.instruments]: 'instruments',
  [KnowledgeGraphActivityClass.divison_of_labour]: 'division_of_labour',
  [KnowledgeGraphActivityClass.community]: 'community',
};

const availableParticipantsByClass = ref<Record<KnowledgeGraphActivityClass, Participant[]>>({
  [KnowledgeGraphActivityClass.subject]: [],
  [KnowledgeGraphActivityClass.object]: [],
  [KnowledgeGraphActivityClass.rules]: [],
  [KnowledgeGraphActivityClass.instruments]: [],
  [KnowledgeGraphActivityClass.divison_of_labour]: [],
  [KnowledgeGraphActivityClass.community]: [],
});

const selectedParticipantIdsByClass = ref<Record<KnowledgeGraphActivityClass, string[]>>({
  [KnowledgeGraphActivityClass.subject]: [],
  [KnowledgeGraphActivityClass.object]: [],
  [KnowledgeGraphActivityClass.rules]: [],
  [KnowledgeGraphActivityClass.instruments]: [],
  [KnowledgeGraphActivityClass.divison_of_labour]: [],
  [KnowledgeGraphActivityClass.community]: [],
});

const originalParticipantIdsByClass = ref<Record<KnowledgeGraphActivityClass, string[]>>({
  [KnowledgeGraphActivityClass.subject]: [],
  [KnowledgeGraphActivityClass.object]: [],
  [KnowledgeGraphActivityClass.rules]: [],
  [KnowledgeGraphActivityClass.instruments]: [],
  [KnowledgeGraphActivityClass.divison_of_labour]: [],
  [KnowledgeGraphActivityClass.community]: [],
});

const textChanged = computed(() =>
  editedTitle.value !== originalTitle.value || editedDescription.value !== originalDescription.value
);

const flattenSelectedIds = (source: Record<KnowledgeGraphActivityClass, string[]>) =>
  classOrder.flatMap((activityClass) => source[activityClass]);

const hasAnyParticipantSelected = computed(() =>
  flattenSelectedIds(selectedParticipantIdsByClass.value).length > 0
);

const participantsChanged = computed(() => {
  const current = new Set(flattenSelectedIds(selectedParticipantIdsByClass.value));
  const original = new Set(flattenSelectedIds(originalParticipantIdsByClass.value));
  if (current.size !== original.size) return true;
  for (const id of current) {
    if (!original.has(id)) return true;
  }
  return false;
});

const hasChanges = computed(() => textChanged.value || participantsChanged.value);

// Set status from props
const selectedStatus = ref<any>(props.status);

// Stores for the conflicts and the session
const conflictStore = useConflictsStore();
const sessionStore = useSessionStore();


const textareaRef = ref<HTMLTextAreaElement | null>(null);

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
  await updateConflict(sessionStore.sessionActivity!.graph, props.conflict.id, conflictPredicate.status, newStatus);
  conflictStore.updateConflict(props.conflict.id, sessionStore.sessionActivity!.graph);
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
    saveReply(props.conflict.id);
  }
};

const getLocalizedText = (record: Record<string, string> | undefined) => {
  if (!record) return '';
  return record[sessionStore.activeLanguage]
    || record.default
    || Object.values(record)[0]
    || '';
};

const stripHtml = (input: string) => input.replace(/<[^>]*>/g, '').trim();

const activityClassTypeMap: Record<KnowledgeGraphActivityClass, Participant['type']> = {
  [KnowledgeGraphActivityClass.subject]: 'subject',
  [KnowledgeGraphActivityClass.object]: 'object',
  [KnowledgeGraphActivityClass.rules]: 'rules',
  [KnowledgeGraphActivityClass.instruments]: 'instruments',
  [KnowledgeGraphActivityClass.divison_of_labour]: 'division_of_labour',
  [KnowledgeGraphActivityClass.community]: 'community',
};

const loadParticipants = async () => {
  if (!sessionStore.sessionActivity) return;
  const results = await Promise.all(
    classOrder.map((activityClass) => getActivityClassIds(sessionStore.sessionActivity!.graph, activityClass))
  );

  const nextAvailable: Record<KnowledgeGraphActivityClass, Participant[]> = {
    [KnowledgeGraphActivityClass.subject]: [],
    [KnowledgeGraphActivityClass.object]: [],
    [KnowledgeGraphActivityClass.rules]: [],
    [KnowledgeGraphActivityClass.instruments]: [],
    [KnowledgeGraphActivityClass.divison_of_labour]: [],
    [KnowledgeGraphActivityClass.community]: [],
  };

  results.forEach((items, index) => {
    const activityClass = classOrder[index];
    const type = activityClassTypeMap[activityClass];
    nextAvailable[activityClass] = items.map((item) => ({ id: item.id, labels: item.labels, type }));
  });

  (props.conflict.participants || []).forEach((participant: Participant) => {
    const activityClass = classOrder.find((klass) => activityClassTypeMap[klass] === participant.type);
    if (activityClass) {
      const existing = nextAvailable[activityClass].some((item) => item.id === participant.id);
      if (!existing) {
        nextAvailable[activityClass].push(participant);
      }
    }
  });

  availableParticipantsByClass.value = nextAvailable;
};

const getSelectedParticipantsText = (activityClass: KnowledgeGraphActivityClass) => {
  const selectedIds = selectedParticipantIdsByClass.value[activityClass];
  const available = availableParticipantsByClass.value[activityClass] || [];
  const selected = available.filter((participant) => selectedIds.includes(participant.id));
  if (selected.length === 0) {
    return activateTerms[sessionStore.activeLanguage][classKeyMap[activityClass]];
  }
  if (selected.length <= 3) {
    return selected
      .map((participant) => buildLanguageString(participant, sessionStore.activeLanguage, true))
      .join(', ');
  }
  return `${selected.length} ${activateTerms[sessionStore.activeLanguage][classKeyMap[activityClass]]}`;
};

const toggleParticipant = (activityClass: KnowledgeGraphActivityClass, participantId: string, checked: boolean) => {
  const current = selectedParticipantIdsByClass.value[activityClass];
  if (checked) {
    if (!current.includes(participantId)) {
      selectedParticipantIdsByClass.value = {
        ...selectedParticipantIdsByClass.value,
        [activityClass]: [...current, participantId],
      };
    }
  } else {
    selectedParticipantIdsByClass.value = {
      ...selectedParticipantIdsByClass.value,
      [activityClass]: current.filter((id) => id !== participantId),
    };
  }
};

const openEditDialog = async () => {
  originalTitle.value = stripHtml(getLocalizedText(props.conflict.title));
  originalDescription.value = stripHtml(getLocalizedText(props.conflict.description));
  editedTitle.value = originalTitle.value;
  editedDescription.value = originalDescription.value;
  const initialByClass: Record<KnowledgeGraphActivityClass, string[]> = {
    [KnowledgeGraphActivityClass.subject]: [],
    [KnowledgeGraphActivityClass.object]: [],
    [KnowledgeGraphActivityClass.rules]: [],
    [KnowledgeGraphActivityClass.instruments]: [],
    [KnowledgeGraphActivityClass.divison_of_labour]: [],
    [KnowledgeGraphActivityClass.community]: [],
  };

  (props.conflict.participants || []).forEach((participant: Participant) => {
    const activityClass = classOrder.find((klass) => activityClassTypeMap[klass] === participant.type);
    if (activityClass) {
      initialByClass[activityClass] = [...initialByClass[activityClass], participant.id];
    }
  });

  originalParticipantIdsByClass.value = { ...initialByClass };
  selectedParticipantIdsByClass.value = { ...initialByClass };
  await loadParticipants();
  isEditDialogOpen.value = true;
};

const closeEditDialog = () => {
  isEditDialogOpen.value = false;
};

const saveEditedConflict = async () => {
  if (!hasChanges.value) {
    closeEditDialog();
    return;
  }
  if (!hasAnyParticipantSelected.value) {
    isParticipantRequiredOpen.value = true;
    return;
  }
  try {
    if (textChanged.value) {
      await updateConflictText(
        sessionStore.sessionActivity!.graph,
        props.conflict.id,
        editedTitle.value,
        editedDescription.value,
        sessionStore.activeLanguage
      );
    }

    if (participantsChanged.value) {
      const current = new Set(flattenSelectedIds(selectedParticipantIdsByClass.value));
      const original = new Set(flattenSelectedIds(originalParticipantIdsByClass.value));
      const toAdd = Array.from(current).filter((id) => !original.has(id));
      const toRemove = Array.from(original).filter((id) => !current.has(id));

      await Promise.all([
        ...toAdd.map((id) => updateConflictParticipants(sessionStore.sessionActivity!.graph, props.conflict.id, RDFOperation.insert, id)),
        ...toRemove.map((id) => updateConflictParticipants(sessionStore.sessionActivity!.graph, props.conflict.id, RDFOperation.delete, id)),
      ]);
    }
    await conflictStore.refreshConflictList();
    closeEditDialog();
  } catch (error) {
    console.error('Error updating conflict text: ', error);
  }
};

const cancelEdit = () => {
  if (!hasChanges.value) {
    closeEditDialog();
    return;
  }
  isDiscardDialogOpen.value = true;
};

const confirmDiscardChanges = () => {
  isDiscardDialogOpen.value = false;
  closeEditDialog();
};

const cancelDiscardChanges = () => {
  isDiscardDialogOpen.value = false;
};
// TODO
// const showOrigin = async () => {
//   isShowOriginOpen.value = false;
// }
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

// const cleanContent = computed(() => {
//   if (!props.content) return '';

//   // Remove all <span class="ql-ui" contenteditable="false"></span> from the string
//   return props.content.replace(/<span class="ql-ui" contenteditable="false"><\/span>/g, '');
// });

// const cleanAndWrapLists = computed(() => {
//   if (!props.content) return '';

//   // 1. Remove the empty spans first
//   let html = props.content.replace(/<span class="ql-ui" contenteditable="false"><\/span>/g, '');

//   // 2. Convert li with data-list="ordered" into proper <ol><li>...</li></ol>
//   // and li with data-list="bullet" into <ul><li>...</li></ul>

//   // We do this by splitting content on li and grouping
//   // Here is a simple regex-based approach:

//   // Match all <li data-list="ordered">...</li>
//   const orderedListItems = html.match(/<li data-list="ordered">(.*?)<\/li>/gs) || [];
//   if (orderedListItems.length) {
//     // Replace all these lis with just <li>content</li>
//     const orderedLis = orderedListItems.map(item =>
//       item.replace(/<li data-list="ordered">/, '<li>').replace('</li>', '</li>')
//     ).join('');
//     // Replace all ordered lis in original with empty string
//     html = html.replace(/<li data-list="ordered">(.*?)<\/li>/gs, '');

//     // Insert the <ol> wrapper before the first ordered li was, append after last
//     // (Simple approach: prepend ol + joined lis + close ol to start of html)
//     html = `<ol>${orderedLis}</ol>` + html;
//   }

//   // Similarly for bullet
//   const bulletListItems = html.match(/<li data-list="bullet">(.*?)<\/li>/gs) || [];
//   if (bulletListItems.length) {
//     const bulletLis = bulletListItems.map(item =>
//       item.replace(/<li data-list="bullet">/, '<li>').replace('</li>', '</li>')
//     ).join('');
//     html = html.replace(/<li data-list="bullet">(.*?)<\/li>/gs, '');
//     html = `<ul>${bulletLis}</ul>` + html;
//   }

//   return html;
// });


</script>

<template>
  <div class="note-card" :class="[selectedStatus, { 'grayed-out': isGrayedOut }]">
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ staticContent.noteCards.editConflict[sessionStore.activeLanguage] }}
          </DialogTitle>
        </DialogHeader>
        <input v-model="editedTitle" class="w-full border rounded p-2 my-2 dark:bg-gray-900"
          :placeholder="staticContent.placeholders.title[sessionStore.activeLanguage]" />
        <textarea v-model="editedDescription" class="w-full border rounded p-2 my-2 dark:bg-gray-900"
          :placeholder="staticContent.placeholders.description[sessionStore.activeLanguage]" />
        <div class="my-2 space-y-3">
          <div v-for="activityClass in classOrder" :key="activityClass">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ activateTerms[sessionStore.activeLanguage][classKeyMap[activityClass]] }}
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-full justify-between mt-2">
                  <span class="truncate">{{ getSelectedParticipantsText(activityClass) }}</span>
                  <span class="text-xs">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="max-h-64 w-[--radix-dropdown-menu-trigger-width] overflow-y-auto">
                <DropdownMenuLabel>
                  {{ activateTerms[sessionStore.activeLanguage][classKeyMap[activityClass]] }}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  v-for="participant in availableParticipantsByClass[activityClass]"
                  :key="participant.id"
                  :checked="selectedParticipantIdsByClass[activityClass].includes(participant.id)"
                  @update:checked="(checked) => toggleParticipant(activityClass, participant.id, checked)"
                >
                  {{ buildLanguageString(participant, sessionStore.activeLanguage, true) }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <DialogFooter class="flex justify-between">
          <Button variant="secondary" @click="cancelEdit">
            {{ staticContent.noteCards.cancel[sessionStore.activeLanguage] }}
          </Button>
          <Button @click="saveEditedConflict">
            {{ staticContent.noteCards.save[sessionStore.activeLanguage] }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDiscardDialog
      v-model:open="isDiscardDialogOpen"
      @confirm="confirmDiscardChanges"
      @cancel="cancelDiscardChanges"
    />

    <Dialog v-model:open="isParticipantRequiredOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ staticContent.errors.participantRequired[sessionStore.activeLanguage] }}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter class="flex justify-end">
          <Button variant="destructive" @click="isParticipantRequiredOpen = false">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
      <!-- Delete button -->
      <!-- TODO implement "are you sure?" -->
      <div class="flex items-center gap-2">
        <button v-if="sessionStore.instructorView" class="icon-button" @click="openEditDialog">
          <span class="material-symbols-outlined">edit</span>
        </button>
        <button class="icon-button" @click="handleDelete(props.conflict.id)">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>

    <hr class="note-divider" />

    <div class="note-card-content">
      <!-- Note title -->
      <div class="note-title" v-html="props.title"></div>
      <!-- Note origin -->
      <!-- <div class="note-origin">
        <Dialog v-model:open="isShowOriginOpen">
          <DialogTrigger as-child>
            <Button>
              {{ staticContent.noteCards.showOrigin[sessionStore.activeLanguage] }}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{{
                staticContent.noteCards.origin[sessionStore.activeLanguage] }}
              </DialogTitle>
              <DialogDescription>
                {{ props.origin }}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button @click="() => showOrigin()">{{ staticContent.noteCards.cancel[sessionStore.activeLanguage]
              }}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div> -->

      <!-- Participants grouped by type -->
      <div class="note-participants">
        <div v-for="(group, type) in groupedParticipants" :key="type" class="participant-group">
          <div class="participant-group-box">
            <strong class="participant-group-title">{{ activateTerms[sessionStore.activeLanguage][type] }}:</strong>
            <div class="participant-tag-container">
              <span v-for="participant in group" :key="participant.id" class="participant-tag">
                {{ buildLanguageString(participant, sessionStore.activeLanguage, true) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="note-content" v-html="props.content"></div>
    </div>

    <!-- Note comment section starting with add comment button -->

    <div v-if="!replyInputVisible[conflict.id]" class="note-comment-section">
      <Button @click="toggleReplyInput(conflict.id)">
        {{ staticContent.noteCards.addComment[sessionStore.activeLanguage] }} </Button>
    </div>

    <div v-if="replyInputVisible[conflict.id]" class="comment-input">
      <Button @click="toggleReplyInput(conflict.id)">
        {{ staticContent.noteCards.cancel[sessionStore.activeLanguage] }} </Button>
      <textarea ref="textareaRef" v-model="newReplyText[conflict.id]"
        :placeholder="staticContent.placeholders.answer[sessionStore.activeLanguage]"
        @keydown.enter="handleEnterKey($event)" />
      <Button @click="saveReply(conflict.id)">{{ staticContent.noteCards.save[sessionStore.activeLanguage] }}</Button>
    </div>

    <div v-if="conflictDetail && conflictDetail.replies && conflictDetail.replies.length > 0" class="reply-container">
      <ReplyCard v-for="(reply) in conflictDetail.replies" :key="reply.id" :parentComment="reply"
        :conflictId="conflict.id" :showEdit="sessionStore.instructorView" @deleteComment="removeReply" @refresh="refreshReplies" />
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
  /**display: block !important;*/

}

/**

.note-content ul,
.note-content ol {
  list-style-type: disc !important;
  margin-left: 1.5em !important;
  padding-left: 1.5em !important;
  display: block !important;
}

.note-content li {
  display: list-item !important;
} */
</style>
