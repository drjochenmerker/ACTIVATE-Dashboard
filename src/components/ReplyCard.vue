<script lang="ts" setup>
import { defineProps } from 'vue';
import { deleteComment } from '@/data/knowledge_graph/write_operations';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';

/** 
 * ReplyCard-Component
 * Shows a reply for a specific parent element
 * 
 * ToDo:
    * Originally planned: Recursive component to show nested replies
    * which is already implemented in the backend
    * SEE "inProgress_ReplyCard.txt"
 */

const props = defineProps({
    parentComment: {
        type: Object,
        required: true,
    },
});

// Store
const sessionStore = useSessionStore();
const conflictStore = useConflictsStore();

// Helper function to see if a comment has replies
const hasReplies = (comment: any) => Array.isArray(comment.replies) && comment.replies.length > 0;

const emit = defineEmits(['deleteComment']);

/**
 * Handles the deletion of a comment, supporting both top-level and nested comments
 * 
 * @param {string} id - The unique identifier of the comment to be deleted
 * @param {any} parentComment - The parent comment object containing potential nested replies
 * @returns {Promise<void>} Deletes the comment and updates the comment list accordingly
 */
const handleDelete = async (id: string, parentComment: any) => {
    try {
        // Delete the comment (is it a nested comment?)
        const isNestedComment = hasReplies(parentComment);


        // Call deleteComment function and refresh the conflict list
        const response = await deleteComment(sessionStore.sessionActivity!.graph, id, isNestedComment);
        conflictStore.refreshConflictList();

        if (response.status === "OK") {
            // Inform the parent
            emit('deleteComment', id);

            // If comment is nested, remove it from the replies
            if (parentComment.replies) {
                parentComment.replies = parentComment.replies.filter((reply: any) => reply.id !== id);
            }

            // If comment is not nested, delete it directly
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


</script>

<template>
    <div class="reply-card">

        <div class="reply-content">
            <div class="reply-head">
                <p class="reply-author">{{ props.parentComment.author }}</p>
                <button class="icon-button" @click="handleDelete(props.parentComment.id, props.parentComment)">
                    <span class="material-symbols-outlined">delete</span>
                </button>

            </div>
            <p class="reply-text">{{ props.parentComment.comment }}</p>
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
