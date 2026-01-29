<script lang="ts" setup>
import { nextTick, ref } from 'vue';
import { CustomButton } from '@/components/ui/button';
import { addComment, deleteComment } from '@/data/knowledge_graph/write_operations';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';
import { useColorMode } from '@vueuse/core';
import { Comment } from '@/data/knowledge_graph/structures';

/**
 * ReplyCard-Component
 * Shows a reply for a specific parent element
 */

const props = defineProps<{
    parentComment: Comment;
}>();

const colorMode = useColorMode();

// Store
const sessionStore = useSessionStore();
const conflictStore = useConflictsStore();

// Toggle for visibility of reply input field
const replyInputVisible = ref(false);
const newReplyText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const toggleReplyInput = async () => {
    replyInputVisible.value = !replyInputVisible.value;
    if (replyInputVisible.value) {
        await nextTick();
        textareaRef.value?.focus();
    }
};

// Function to save a reply
const saveReply = async (parentCommentId: string) => {
    if (!newReplyText.value) return;
    try {
        await addComment(parentCommentId, newReplyText.value);

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

const emit = defineEmits(['deleteComment']);
// Delete comment
const handleDelete = async (id: string, parentComment: Comment) => {
    try {
        // Delete the comment (is it a nested comment?)
        const isNestedComment = hasReplies(parentComment);

        // call deleteComment function
        const response = await deleteComment(sessionStore.sessionActivity!.graph, id, isNestedComment);
        conflictStore.refreshConflictList();

        if (response.status === 'OK') {
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
            console.error('Error while deleting the reply.');
        }
    } catch (error) {
        console.error('Error while deleting the reply: ', error);
    }
};
</script>

<template>
    <div class="reply-card" :class="{ dark: colorMode === 'dark' }">
        <div class="reply-content">
            <div class="reply-head">
                <p class="reply-author">
                    {{
                        props.parentComment.author?.labels[sessionStore.activeLanguage] ||
                        props.parentComment.author?.labels['default']
                    }}
                </p>
                <button class="icon-button" @click="handleDelete(props.parentComment.id, props.parentComment)">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
            <!-- TODO maybe handle multi-language comments -->
            <p class="reply-text">
                {{
                    props.parentComment.comment?.[sessionStore.activeLanguage]?.trim() ||
                    props.parentComment.comment?.['default']?.trim() ||
                    Object.values(props.parentComment.comment || {}).find(
                        (c) => typeof c === 'string' && c.trim() !== '',
                    ) ||
                    ''
                }}
            </p>
        </div>

        <!-- Reply Button to hide input field -->
        <CustomButton @click="toggleReplyInput()">
            {{
                replyInputVisible
                    ? staticContent.noteCards.cancel[sessionStore.activeLanguage]
                    : staticContent.noteCards.answer[sessionStore.activeLanguage]
            }}
        </CustomButton>

        <!-- Reply input field -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea
                ref="textareaRef"
                v-model="newReplyText"
                :placeholder="staticContent.placeholders.answer[sessionStore.activeLanguage]"
                @keydown.enter="handleEnterKey($event)"
            ></textarea>
            <CustomButton @click="saveReply(props.parentComment.id)">{{
                staticContent.noteCards.saveComment[sessionStore.activeLanguage]
            }}</CustomButton>
        </div>

        <div
            v-if="Array.isArray(props.parentComment.replies) && props.parentComment.replies.length"
            class="nested-replies"
        >
            <ReplyCard
                v-for="nestedReply in props.parentComment.replies"
                :key="nestedReply.id"
                :parent-comment="nestedReply"
                @delete-comment="handleDelete(props.parentComment.id, props.parentComment)"
            />
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
