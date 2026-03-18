<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
import { ButtonComponent } from '@/components/ui/button';
import DeletionPopUp from '@/components/DeletionPopUp.vue';
import { addComment, deleteComment, updateComment } from '@/data/knowledge_graph/write_operations';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';
import { useColorMode } from '@vueuse/core';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDiscardDialog from './ui/dialog/ConfirmDiscardDialog.vue';
import { useMiscsStore } from "@/stores/miscsStore";
import { Comment } from "@/data/knowledge_graph/structures";

/** 
 * ReplyCard-Component
 * Shows a reply for a specific parent element
 */

const props = defineProps<{
    parentComment: Comment;
    showEdit: boolean;
}>();

const colorMode = useColorMode();

// Store
const sessionStore = useSessionStore();
const conflictStore = useConflictsStore();
const miscStore = useMiscsStore();


// Toggle for visibility of reply input field
const replyInputVisible = ref(false);
const newReplyText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const isEditDialogOpen = ref(false);
const isDiscardDialogOpen = ref(false);
const editedCommentText = ref('');
const originalCommentText = ref('');
const hasChanges = computed(() => editedCommentText.value !== originalCommentText.value);

const currentReplyText = () => {
    const comment = props.parentComment?.comment;
    const lang = sessionStore.activeLanguage;
    if (!comment) return '';
    if (typeof comment === 'string') return comment;
    if(comment[lang]?.trim()) return comment[lang]?.trim();
    if(comment['default']?.trim()) return comment['default']?.trim();
     return  Object.values(comment).find(c => typeof c === 'string' && c.trim() !== '') ||'';
};

const authorLabel = () => {
    if (!props.parentComment?.author) return '';
    let authorNode = props.parentComment.author;
    if( typeof authorNode === 'string' ) {
        const authorId = authorNode.split('#').pop();
        authorNode = useSessionStore().getRoleById(useSessionStore().availableRoles || {}, authorId || authorNode) ?? '';
    }
    if (!authorNode || typeof authorNode === 'string') return 'Unknown';
    const labels = authorNode.labels || {};
    const lang = sessionStore.activeLanguage;
    if(labels?.[lang]) return labels?.[lang];
    if(labels?.['default']) return labels?.['default'];
    if(Object.keys(labels).length > 0) {
        const label = Object.values(labels).find(label => typeof label === 'string' && label.trim() !== '');
        if(label) return label;
    }
    return authorNode;
    
   
};
const toggleReplyInput = async () => {
    replyInputVisible.value = !replyInputVisible.value;
    if (replyInputVisible.value) {
        await nextTick();
        textareaRef.value?.focus();
    }
}

// Function to save a reply
const saveReply = async (parentCommentId: string) => {
    if (!newReplyText.value) return;
    try {
        await addComment(
            parentCommentId,
            newReplyText.value
        );

        miscStore.fetchMiscs()
        emit('refresh');


        replyInputVisible.value = false; // hide input field
        newReplyText.value = ''; // empty the text field 
    } catch (error) {
        console.error('Error while saving the reply: ', error);
    }

    await conflictStore.refreshConflictList();
};



// Function to submit via Enter key in textarea
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveReply(props.parentComment.id);
    }
};

// help function
const hasReplies = (comment: Comment) => Array.isArray(comment.replies) && comment.replies.length > 0;

const emit = defineEmits(['deleteComment', 'refresh']);

const getCommentText = (comment: Comment) => {
    if (!comment?.comment) return '';
    if (typeof comment.comment === 'string') return comment.comment;
    const commentRecord = comment.comment as Record<string, string>;
    return commentRecord[sessionStore.activeLanguage]
        || commentRecord.default
        || Object.values(commentRecord)[0]
        || '';
};

const openEditDialog = () => {
    originalCommentText.value = getCommentText(props.parentComment);
    editedCommentText.value = originalCommentText.value;
    isEditDialogOpen.value = true;
};

const closeEditDialog = () => {
    isEditDialogOpen.value = false;
};

const saveEditedComment = async () => {
    if (!hasChanges.value) {
        closeEditDialog();
        return;
    }
    try {
        await updateComment(
            sessionStore.sessionActivity!.graph,
            props.parentComment.id,
            editedCommentText.value,
            sessionStore.activeLanguage
        );
        await conflictStore.refreshConflictList();
        emit('refresh');
        closeEditDialog();
    } catch (error) {
        console.error('Error updating comment:', error);
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

// Delete comment
const handleDelete = async (id: string, parentComment: Comment) => {
    try {
        // Delete the comment (is it a nested comment?)
        const isNestedComment = hasReplies(parentComment);


        // call deleteComment function
        const response = await deleteComment(sessionStore.sessionActivity!.graph, id, isNestedComment);
        conflictStore.refreshConflictList();

        if (response.status === "OK") {
            // inform the parent
            emit('deleteComment', id);

            //parentComment.comment = "This comment is deleted.";
            // if comment is nested, remove it from the replies
            if (parentComment.replies) {
                parentComment.replies = parentComment.replies.filter((reply: Comment) => reply.id !== id);
            }

            // if comment is not nested, delete it directly
            if (!parentComment.replies || parentComment.replies.length === 0) {
                //isDeleted.value = true;
            }
        } else {
            console.error("Error while deleting the reply.");
        }
    } catch (error) {
        console.error("Error while deleting the reply: ", error);
    }
};

const removeReply = (id: string) => {
    if (!Array.isArray(props.parentComment.replies)) return;
    props.parentComment.replies = props.parentComment.replies.filter(reply => reply.id !== id);
    conflictStore.refreshConflictList();
};

const refreshReplies = async () => {
    await conflictStore.refreshConflictList();
};

</script>

<template>
    <div class="reply-card" :class="{ 'dark': colorMode === 'dark' }">

        <Dialog v-model:open="isEditDialogOpen">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {{ staticContent.noteCards.editComment[sessionStore.activeLanguage] }}
                    </DialogTitle>
                </DialogHeader>
                <textarea v-model="editedCommentText" class="w-full border rounded p-2 my-2 dark:bg-gray-900" />
                <DialogFooter class="flex justify-between">
                    <ButtonComponent variant="secondary" @click="cancelEdit">
                        {{ staticContent.noteCards.cancel[sessionStore.activeLanguage] }}
                    </ButtonComponent>
                    <ButtonComponent @click="saveEditedComment">
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

        <div class="reply-content">
            <div class="reply-head">
                <p class="reply-author">{{ 
                   authorLabel()
                }}</p>
                <div class="flex items-center gap-2">
                    <!-- Edit button -->
                    <button v-if="props.showEdit && sessionStore.instructorView" class="icon-button" @click="openEditDialog">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <!-- Delete button -->
                    <DeletionPopUp
                    v-if="typeof props.parentComment.author !== 'string'"
                        :title="staticContent.startPage.deleteReply[sessionStore.activeLanguage]"
                        :description="staticContent.startPage.deleteReplyConfirm[sessionStore.activeLanguage]"
                        :author="props.parentComment.author?.id"
                        :delete-function="() => handleDelete(props.parentComment.id, props.parentComment)"
                    >
                    </DeletionPopUp>
                </div>    
            </div>
            <p class="reply-text">
                {{
                    currentReplyText()
                }}
            </p>

        </div>

        <!-- Reply Button to hide input field -->
        <ButtonComponent @click="toggleReplyInput()">
            {{ replyInputVisible ? staticContent.noteCards.cancel[sessionStore.activeLanguage] :
                staticContent.noteCards.answer[sessionStore.activeLanguage] }}
        </ButtonComponent>

        <!-- Reply input field -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea
ref="textareaRef" v-model="newReplyText"
                :placeholder="staticContent.placeholders.answer[sessionStore.activeLanguage]"
                @keydown.enter="handleEnterKey($event)"></textarea>
            <ButtonComponent @click="saveReply(props.parentComment.id)">{{
                staticContent.noteCards.saveComment[sessionStore.activeLanguage] }}</ButtonComponent>
        </div>

        <div
v-if="Array.isArray(props.parentComment.replies) && props.parentComment.replies.length"
            class="nested-replies">
            <ReplyCard
v-for="nestedReply in props.parentComment.replies" :key="nestedReply.id"
                :parent-comment="nestedReply" :show-edit="props.showEdit" @delete-comment="removeReply" @refresh="refreshReplies" @save="saveReply"/>
        </div>

    </div>
</template>


<style scoped>
.reply-card {
    border-left: 2px solid #ccc;
    padding-left: 10px;
    margin-left: 10px;
    margin-top: 10px;
}



.reply-content {
    background-color: #f9f9f9;
    padding: 10px;
    border-radius: 5px;
}

.dark .reply-content {
    background-color: #222;
    color: #fff;
}

.reply-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.reply-author {
    font-weight: bold;
}

.reply-text {
    margin-top: 5px;
}

.reply-input {
    margin-top: 10px;
}

.reply-input textarea {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 8px;
    resize: vertical;
}

.nested-replies {
    margin-top: 10px;
    padding-left: 20px;
}
</style>
