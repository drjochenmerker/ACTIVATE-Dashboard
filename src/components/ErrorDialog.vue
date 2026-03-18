<script setup lang="ts">
import { computed } from 'vue';
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
import { ButtonComponent } from '@/components/ui/button'
import { useErrorDialog } from '@/composables/useErrorDialog';

const sessionStore = useSessionStore();
const { isOpen, errorType, errorMessage, llmError, closeError } = useErrorDialog();

const dialogTitle = computed(() => {
    if (errorType.value === 'validation') {
        return staticContent.errors.validationTitle[sessionStore.activeLanguage];
    }
    if (errorType.value === 'llm') {
        return staticContent.errors.llmTitle[sessionStore.activeLanguage];
    }
    return staticContent.errors.unexpectedTitle[sessionStore.activeLanguage];
});

const dialogMessage = computed(() => {

    if (typeof errorMessage.value === 'string') {
        if (errorMessage.value.trim() !== '') {
            return errorMessage.value;
        }
    } else {
        return errorMessage.value[sessionStore.activeLanguage];
    }

    if (errorType.value === 'validation') {
        return staticContent.errors.validationActionFailed[sessionStore.activeLanguage];
    }
    if (errorType.value === 'llm') {
        return staticContent.errors.llmActionFailed[sessionStore.activeLanguage];
    }
    return staticContent.errors.unexpectedActionFailed[sessionStore.activeLanguage];
});
</script>

<template>
    <Dialog v-model:open="isOpen">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {{ dialogTitle }}
                </DialogTitle>
                <DialogDescription class="pt-2">
                    {{ dialogMessage }}
                </DialogDescription>
                <DialogDescription v-if="errorType === 'llm' && llmError" class="pt-2 whitespace-pre-wrap break-words text-xs opacity-80">
                    {{ staticContent.errors.technicalDetailsLabel[sessionStore.activeLanguage] }}: {{ llmError }}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="mt-4">
                <ButtonComponent @click="closeError" class="w-full">
                    {{ staticContent.noteCards.ok[sessionStore.activeLanguage] }}
                </ButtonComponent>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
