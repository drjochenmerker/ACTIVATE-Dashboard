<script setup lang="ts">
import { staticContent } from '@/data/contentData';
import { useSessionStore } from '@/stores/sessionStore';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ref } from 'vue';

/**
 * Props of the DeletionPopUp component
 * @property title - Title of the Pop Up
 * @property description - Text of the Pop Up
 * @property deleteFunction - Function that is called when the deletion is confirmed
 */
const { title, description, deleteFunction } = defineProps<{
    title: string;
    description: string;
    deleteFunction: () => Promise<void>;
}>();
const sessionStore = useSessionStore();

const isDeleteDialogOpen = ref(false);

</script>

<template>
    <div class="deletion-pop-up">
        <Dialog v-model:open="isDeleteDialogOpen">
            <DialogTrigger as-child>
                <button class="icon-button">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{{ title }}</DialogTitle>
                    <DialogDescription>
                        {{ description }}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter class="flex justify-between">
                    <Button variant="secondary" @click="isDeleteDialogOpen = false">{{
                        staticContent.terms.cancel[sessionStore.activeLanguage] }}</Button>
                    <Button variant="destructive" @click="() => { deleteFunction(); isDeleteDialogOpen = false; }">{{
                        staticContent.terms.delete[sessionStore.activeLanguage] }}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>