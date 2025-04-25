<script lang="ts" setup>
import { defineProps, nextTick, onMounted, ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { addComment, deleteComment } from '@/data/knowledge_graph/write_operations';
import { useConflictsStore } from '@/stores/conflictsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { staticContent } from '@/data/contentData';
import { useColorMode } from '@vueuse/core';

/** 
 * ReplyCard-Component
 * Shows a reply for a specific parent element
 */

const props = defineProps({
    parentComment: {
        type: Object,
        required: true,
    },
});

const colorMode = useColorMode();

// Store
const sessionStore = useSessionStore();
const conflictStore = useConflictsStore();

// Toggle for visibility of reply input field
const replyInputVisible = ref(false);
const newReplyText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

onMounted(() => {
    console.log(props.parentComment)
})

const toggleReplyInput = async () => {
    replyInputVisible.value = !replyInputVisible.value;
    if (replyInputVisible.value) {
        await nextTick();
        textareaRef.value?.focus();
    }
}

// Function to save a reply
const saveReply = async (parentCommentId: string) => {
    // console.log(`save comment for conflict with id: ${parentCommentId}:`, newReplyText.value);
    if (!newReplyText.value) return;
    try {
        await addComment(
            parentCommentId,
            newReplyText.value
        );
        console.log('reply saved successfully');


        replyInputVisible.value = false; // hide input field
        newReplyText.value = ''; // empty the text field 
    } catch (error) {
        console.error('Error while saving the reply: ', error);
    }

    await conflictStore.refreshConflictList();
};

watch(conflictStore, () => {
    console.log("conflictstore: ", conflictStore.getConflicts);
})

// Function to submit via Enter key in textarea
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveReply(props.parentComment.id);
    }
};

// help function
const hasReplies = (comment: any) => Array.isArray(comment.replies) && comment.replies.length > 0;


const emit = defineEmits(['deleteComment']);
// Delete comment
const handleDelete = async (id: string, parentComment: any) => {
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
                parentComment.replies = parentComment.replies.filter((reply: any) => reply.id !== id);
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

</script>

<template>
    <div class="reply-card" :class="{ 'dark': colorMode === 'dark' }">

        <div class="reply-content">
            <div class="reply-head">
                <p class="reply-author">{{ props.parentComment.author }}</p>
                <button class="icon-button" @click="handleDelete(props.parentComment.id, props.parentComment)">
                    <span class="material-symbols-outlined">delete</span>
                </button>

            </div>
            <p class="reply-text">{{ props.parentComment.comment }}</p>
        </div>

        <!-- Reply Button to hide input field -->
        <Button @click="toggleReplyInput()">
            {{ replyInputVisible ? staticContent.noteCards.cancel[sessionStore.activeLanguage] : staticContent.noteCards.answer[sessionStore.activeLanguage] }}
        </Button>

        <!-- Reply input field -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea ref="textareaRef" v-model="newReplyText" :placeholder="staticContent.placeholders.answer[sessionStore.activeLanguage]"
                @keydown.enter="handleEnterKey($event)"></textarea>
            <Button @click="saveReply(props.parentComment.id)">{{staticContent.noteCards.saveComment[sessionStore.activeLanguage]}}</Button>
        </div>

        <div v-if="Array.isArray(props.parentComment.replies) && props.parentComment.replies.length"
            class="nested-replies">
            <ReplyCard v-for="nestedReply in props.parentComment.replies" :key="nestedReply.id"
                :parentComment="nestedReply" @deleteComment="removeReply" />
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
