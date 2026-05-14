<script lang="ts" setup>
import { ref, computed } from 'vue';
import { updateComment } from "@/data/knowledge_graph/write_operations";
import { ButtonComponent } from '@/components/ui/button';
import { useSessionStore } from '@/stores/sessionStore';
import { useConflictsStore } from '@/stores/conflictsStore';
import { staticContent } from '@/data/contentData';
import ConfirmDiscardDialog from './ConfirmDiscardDialog.vue';
import LoadingOverlay from '@/components/LoadingOverlay.vue';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  }
});

const emit = defineEmits(['close', 'saved']);

const isEditDialogOpen = ref(false);
const isDiscardDialogOpen = ref(false);
const isSaving = ref(false);
const editedTitle = ref('');
const editedDescription = ref('');
const originalTitle = ref('');
const originalDescription = ref('');

const sessionStore = useSessionStore();
const conflictStore = useConflictsStore();

const textChanged = computed(() =>
  editedTitle.value !== originalTitle.value || editedDescription.value !== originalDescription.value
);

const hasChanges = computed(() => textChanged.value);

const stripHtml = (input: string) => input.replace(/<[^>]*>/g, '').trim();

const openEditDialog = async () => {
  // Extract title and description from comment (format: "title|description")
  const [title, description] = (props.comment.comment || '').split('|');
  originalTitle.value = stripHtml(title || '');
  originalDescription.value = stripHtml(description || '');
  editedTitle.value = originalTitle.value;
  editedDescription.value = originalDescription.value;
  isEditDialogOpen.value = true;
};

const closeEditDialog = () => {
  isEditDialogOpen.value = false;
  emit('close');
};

const saveEditedComment = async () => {
  if (!hasChanges.value) {
    closeEditDialog();
    return;
  }

  isSaving.value = true;
  try {
    if (textChanged.value) {
      const combinedText = `${editedTitle.value}|${editedDescription.value}`;
      await updateComment(
        sessionStore.sessionActivity!.graph,
        props.comment.id,
        combinedText,
        sessionStore.activeLanguage
      );
    }

    await conflictStore.refreshConflictList();
    closeEditDialog();
    emit('saved');
  } catch (error) {
    console.error('Error updating comment text: ', error);
  } finally {
    isSaving.value = false;
  }
  location.reload(); // reload to reflect any potential changes in the misc section
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

defineExpose({
  openEditDialog
});
</script>

<template>
  <div>
    <LoadingOverlay :visible="isSaving" />
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {{ staticContent.noteCards.editComment[sessionStore.activeLanguage] }}
          </DialogTitle>
        </DialogHeader>
        <div class="overflow-y-auto flex-1 pr-2">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ staticContent.noteCards.title[sessionStore.activeLanguage] }}
              </label>
              <input
v-model="editedTitle" class="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-0 focus:border-gray-300 dark:focus:border-white"
                :placeholder="staticContent.placeholders.title[sessionStore.activeLanguage]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ staticContent.noteCards.description[sessionStore.activeLanguage] }}
              </label>
              <textarea
v-model="editedDescription" class="w-full border rounded p-2 dark:bg-gray-900 dark:border-gray-700 min-h-[100px] focus-visible:outline-none focus-visible:ring-0 focus:border-gray-300 dark:focus:border-white"
                :placeholder="staticContent.placeholders.description[sessionStore.activeLanguage]" />
            </div>
          </div>
        </div>
        <DialogFooter class="flex justify-between mt-4">
          <ButtonComponent variant="secondary" :disabled="isSaving" @click="cancelEdit">
            {{ staticContent.noteCards.cancel[sessionStore.activeLanguage] }}
          </ButtonComponent>
          <ButtonComponent :disabled="isSaving" @click="saveEditedComment">
            {{ staticContent.noteCards.save[sessionStore.activeLanguage] }}
          </ButtonComponent>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmDiscardDialog
      v-model:open="isDiscardDialogOpen"
      @confirm="confirmDiscardChanges"
      @cancel="cancelDiscardChanges"
    />
  </div>
</template>
