<script setup lang="ts">
import { staticContent } from '@/data/contentData';
import { useSessionStore } from '@/stores/sessionStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits(['update:open', 'confirm', 'cancel']);

const sessionStore = useSessionStore();

const close = () => emit('update:open', false);

const handleCancel = () => {
  emit('cancel');
  close();
};

const handleConfirm = () => {
  emit('confirm');
  close();
};
</script>

<template>
  <Dialog :open="props.open" @update:open="(value: boolean) => emit('update:open', value)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ staticContent.noteCards.discardChangesQuestion[sessionStore.activeLanguage] }}
        </DialogTitle>
      </DialogHeader>
      <DialogFooter class="flex justify-between">
        <Button variant="secondary" @click="handleCancel">
          {{ staticContent.noteCards.cancel[sessionStore.activeLanguage] }}
        </Button>
        <Button variant="destructive" @click="handleConfirm">
          {{ staticContent.noteCards.discardChanges[sessionStore.activeLanguage] }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
