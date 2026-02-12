<script lang="ts" setup>
import { ref, computed } from 'vue';
import { KnowledgeGraphActivityClass, Participant, RDFOperation } from '@/data/knowledge_graph/structures';
import { updateConflictText, updateConflictParticipants } from "@/data/knowledge_graph/write_operations";
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
  }
});

const emit = defineEmits(['close', 'saved']);

const isEditDialogOpen = ref(false);
const isDiscardDialogOpen = ref(false);
const isParticipantRequiredOpen = ref(false);
const editedTitle = ref('');
const editedDescription = ref('');
const originalTitle = ref('');
const originalDescription = ref('');

const conflictStore = useConflictsStore();
const sessionStore = useSessionStore();

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

const activityClassTypeMap: Record<KnowledgeGraphActivityClass, Participant['type']> = {
  [KnowledgeGraphActivityClass.subject]: 'subject',
  [KnowledgeGraphActivityClass.object]: 'object',
  [KnowledgeGraphActivityClass.rules]: 'rules',
  [KnowledgeGraphActivityClass.instruments]: 'instruments',
  [KnowledgeGraphActivityClass.divison_of_labour]: 'division_of_labour',
  [KnowledgeGraphActivityClass.community]: 'community',
};

const textChanged = computed(() =>
  editedTitle.value !== originalTitle.value || editedDescription.value !== originalDescription.value
);

const flattenSelectedIds = (source: Record<KnowledgeGraphActivityClass, string[]>) =>
  classOrder.flatMap((activityClass) => source[activityClass]);

const hasAnyParticipantSelected = computed(() => {
  // Prüft, ob mindestens zwei unterschiedliche Klassen Participants haben
  const classesWithParticipants = classOrder.filter(
    (activityClass) => selectedParticipantIdsByClass.value[activityClass].length > 0
  );
  return classesWithParticipants.length >= 2;
});

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

const stripHtml = (input: string) => input.replace(/<[^>]*>/g, '').trim();

const getLocalizedText = (record: Record<string, string> | undefined) => {
  if (!record) return '';
  return record[sessionStore.activeLanguage]
    || record.default
    || Object.values(record)[0]
    || '';
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
  const selected = available.filter((participant: Participant) => selectedIds.includes(participant.id));
  if (selected.length === 0) {
    return activateTerms[sessionStore.activeLanguage][classKeyMap[activityClass]];
  }
  if (selected.length <= 3) {
    return selected
      .map((participant: Participant) => buildLanguageString(participant, sessionStore.activeLanguage, true))
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
      [activityClass]: current.filter((id: string) => id !== participantId),
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
  emit('close');
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
    emit('saved');
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

defineExpose({
  openEditDialog
});
</script>

<template>
  <div>
    <Dialog v-model:open="isEditDialogOpen">
      <DialogContent class="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {{ staticContent.noteCards.editConflict[sessionStore.activeLanguage] }}
          </DialogTitle>
        </DialogHeader>
        <div class="overflow-y-auto flex-1 pr-2">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ staticContent.placeholders.title[sessionStore.activeLanguage] }}
              </label>
              <input v-model="editedTitle" class="w-full border rounded p-2 dark:bg-gray-900"
                :placeholder="staticContent.placeholders.title[sessionStore.activeLanguage]" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ staticContent.placeholders.description[sessionStore.activeLanguage] }}
              </label>
              <textarea v-model="editedDescription" class="w-full border rounded p-2 dark:bg-gray-900 min-h-[100px]"
                :placeholder="staticContent.placeholders.description[sessionStore.activeLanguage]" />
            </div>
          </div>
          <div class="mt-4 space-y-3">
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
                    @update:checked="(checked: boolean) => toggleParticipant(activityClass, participant.id, checked)"
                  >
                    {{ buildLanguageString(participant, sessionStore.activeLanguage, true) }}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <DialogFooter class="flex justify-between mt-4">
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
  </div>
</template>
