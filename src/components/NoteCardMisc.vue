<script lang="ts" setup>
import { addComment, deleteComment } from '@/data/knowledge_graph/write_operations';
import { nextTick, ref, watch } from 'vue';
import CustomButton from './ui/button/CustomButton.vue';
import ReplyCard from './ReplyCard.vue';
import { useSessionStore } from '@/stores/sessionStore';
import { useConflictsStore } from '@/stores/conflictsStore';

import { useColorMode } from '@vueuse/core';

/**
 * NoteCard for miscellaneous comments
 * Component that is used to show the miscellaneous comments
 * Not in the NoteCard-Component, because it's a different type of notes that
 * are stored as replies
 *
 * Has almost the same functionalites as the NoteCard-Component
 */

const props = defineProps({
    comment: {
        type: Object,
        required: true,
    },
});

const colorMode = useColorMode();

// store for the session
const sessionStore = useSessionStore();

const graph = sessionStore.sessionActivity!.graph;

const [extractedTitle, extractedContent] = props.comment.comment.split('|');

const conflictDetail = ref(props.comment);
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const emit = defineEmits(['deleteComment', 'refresh']);

/**
 * Watches for changes to the comment prop and updates the local conflictDetail reactive reference
 * Uses deep watching to capture nested changes in the comment object
 * Ensures the local state remains synchronized with the incoming prop
 */
watch(
    () => props.comment,
    (newConflict) => {
        conflictDetail.value = { ...newConflict };
    },
    { deep: true },
);

/**
 * Handles deletion of a miscellaneous comment
 *
 * @param {string} id - The unique identifier of the comment to be deleted
 * @async
 * @throws {Error} Logs any errors encountered during comment deletion
 * @emits deleteComment Event to parent component after successful deletion
 */
const handleDelete = async (id: string) => {
    try {
        //comment cant be nested because its the misc card
        await deleteComment(graph, id, false);
        useConflictsStore().refreshConflictList();
        emit('deleteComment', id); // Event an Parent-Komponente senden
    } catch (error) {
        console.error('Error deleting conflict: ', error);
    }
};

/**
 * Toggles the visibility of the reply input for a specific conflict
 *
 * @param {string} conflictId - The unique identifier of the conflict
 * @async
 * @description
 * - Switches the reply input visibility state for the given conflict
 * - When shown, focuses the textarea after the next DOM update
 * - Clears the reply text when the input is hidden
 */
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

// Handles the key press event for the textarea
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveReply(props.comment.id);
    }
};

/**
 * Saves a reply to a specific comment
 *
 * @param {string} commentId - The unique identifier of the parent comment
 * @async
 * @description
 * - Adds a new comment using the current session role
 * - Initializes replies array if not existing
 * - Refreshes the conflict list and UI
 * - Resets reply input state after successful submission
 * @throws {Error} Logs any errors encountered during comment submission
 */
const saveReply = async (commentId: string) => {
    if (!newReplyText.value[commentId]) return;

    try {
        await addComment(commentId, newReplyText.value[commentId]);

        if (conflictDetail.value) {
            if (!conflictDetail.value.replies) {
                conflictDetail.value.replies = [];
            }
        }

        // Important to refresh the conflict list so that the UI shows the new comment immediately
        useConflictsStore().refreshConflictList();
        emit('refresh');

        replyInputVisible.value[commentId] = false;
        newReplyText.value[commentId] = '';
    } catch (error) {
        console.error('Error saving comment:', error);
    }
};

const removeReply = (id: string) => {
    if (conflictDetail.value && conflictDetail.value.replies) {
        conflictDetail.value.replies = conflictDetail.value.replies.filter((reply: { id: string }) => reply.id !== id);
    }
};
</script>

<template>
    <div class="misc-note-card" :class="{ dark: colorMode === 'dark' }">
        <div class="misc-note-header">
            <span class="misc-note-author">Author: {{ props.comment.author || 'Unknown' }}</span>
            <div>
                <button class="icon-button" @click="handleDelete(props.comment.id)">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        </div>

        <hr class="misc-note-divider" />

        <div class="misc-note-content">
            <!-- v-html is okay because it's not an input field -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="misc-note-title" v-html="extractedTitle"></div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="misc-note-description" v-html="extractedContent"></div>
        </div>

        <div class="note-comment-section">
            <CustomButton @click="toggleReplyInput(props.comment.id)"> Add comment </CustomButton>
        </div>

        <div v-if="replyInputVisible[props.comment.id]" class="comment-input">
            <textarea
                ref="textareaRef"
                v-model="newReplyText[props.comment.id]"
                placeholder="Write a reply..."
                @keydown.enter="handleEnterKey($event)"
            />
            <CustomButton @click="saveReply(props.comment.id)">Save</CustomButton>
        </div>

        <div v-if="props.comment && props.comment.replies && props.comment.replies.length > 0" class="reply-container">
            <ReplyCard
                v-for="reply in conflictDetail.replies"
                :key="reply.id"
                :parent-comment="reply"
                :conflict-id="conflictDetail.id"
                @delete-comment="removeReply"
            />
        </div>
    </div>
</template>

<style scoped>
.misc-note-card {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 100%;
    width: 100%;
}

.dark .misc-note-card {
    background-color: #222;
    border: 1px solid #444;
    color: #fff;
}

.misc-note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
}

.misc-note-author {
    font-size: 14px;
    font-weight: bold;
    color: #333;
}

.dark .misc-note-author {
    color: #fff;
}

.misc-note-divider {
    border: none;
    border-top: 1px solid #ddd;
    margin: 10px 0;
}

.misc-note-content {
    margin-bottom: 10px;
}

.misc-note-title {
    font-size: xx-large;
    font-weight: normal;
}

.misc-note-description {
    font-weight: normal;
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
</style>
