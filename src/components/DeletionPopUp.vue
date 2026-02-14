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
 * @property creator - (optional) Creator of the item to be deleted, used for permission checks
 * @property deleteFunction - Function that is called when the deletion is confirmed
 */
const { title, description, author, deleteFunction } = defineProps<{
    title: string;
    description: string;
    author?: string;
    deleteFunction: () => Promise<void>;
}>();
const sessionStore = useSessionStore();

const isDeleteDialogOpen = ref(false);
const role = () => useSessionStore().sessionRole;
const isInstructor = useSessionStore().instructorMode;
const allowDelete = ref(isInstructor || !author || author == role());

console.log("isInstructor:", isInstructor);
console.log("Author:", author);
console.log("Allow Delete:", allowDelete);

</script>

<template>
    <div class="deletion-pop-up">
        <Dialog v-model:open="isDeleteDialogOpen">
            <DialogTrigger as-child>
                <button :disabled="!allowDelete" class="icon-button" :class="{ 'text-gray-500': !allowDelete }">
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