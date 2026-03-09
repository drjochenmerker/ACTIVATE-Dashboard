<script setup lang="ts">
import { staticContent } from '@/data/contentData';
import { useSessionStore } from '@/stores/sessionStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useErrorDialog } from '@/composables/useErrorDialog';

const sessionStore = useSessionStore();
const { isOpen, errorMessage, errorTitle, llmError, closeError } = useErrorDialog();
</script>

<template>
    <Dialog v-model:open="isOpen">
        <DialogContent class="z-[100]">
            <DialogHeader>
                <DialogTitle>
                    {{ errorTitle || staticContent.errors.llmActionFailed[sessionStore.activeLanguage] }}
                </DialogTitle>
                <DialogDescription class="pt-2">
                    {{ typeof errorMessage === 'string' ? errorMessage : errorMessage[sessionStore.activeLanguage] }}
                </DialogDescription>
                <DialogDescription v-if="llmError" class="pt-2 whitespace-pre-wrap break-words text-xs opacity-80">
                    {{ staticContent.errors.llmErrorLabel[sessionStore.activeLanguage] }}: {{ llmError }}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="mt-4">
                <Button @click="closeError" class="w-full">
                    {{ staticContent.noteCards.ok[sessionStore.activeLanguage] }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
