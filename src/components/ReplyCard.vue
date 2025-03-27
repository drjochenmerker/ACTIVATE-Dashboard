<script lang="ts" setup>
import { computed, defineProps, nextTick, ref } from 'vue';
import { Button } from '@/components/ui/button'; // Button-Komponente importieren
import { addComment, deleteComment } from '@/data/knowledge_graph/write_operations';
import { useActivityStore } from '@/stores/activityStore';

const props = defineProps({
    parentComment: {
        type: Object,
        required: true,
    },
});

// Store
const activityStore = useActivityStore();

// Toggle for visibility of reply input field
const replyInputVisible = ref(false);
const newReplyText = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const isDeleted = ref(false); // Default to false or any initial value


const toggleReplyInput = async () => {
    replyInputVisible.value = !replyInputVisible.value;
    if (replyInputVisible.value) {
        await nextTick();
        textareaRef.value?.focus();
    }
}

// Function to save a reply
const saveReply = async (parentCommentId: string, parentReply?: any) => {
    console.log(`save comment for conflict with id: ${parentCommentId}:`, newReplyText.value);

    if (!newReplyText.value) return;

    try {

        await addComment(
            // There must be a cleaner way, but I know for sure that the activity is not null since it must be set in start page
            activityStore.getActivity()!.graph,
            parentCommentId,
            activityStore.getRole()!,
            newReplyText.value
        );

        if (!parentReply.replies) {
            parentReply.replies = [];
        }
        parentReply.replies = [
            ...parentReply.replies,
            {
                id: Date.now().toString(),
                author: activityStore.getRole()!,
                comment: newReplyText.value,
                replies: [] // empty array for possible nested replies
            }
        ];

        replyInputVisible.value = false; // hide input field
        newReplyText.value = ''; // empty the text field 

        console.log(props.parentComment.comment)
    } catch (error) {
        console.error('Error while saving the reply: ', error);
    }
};

// Function to submit via Enter key in textarea
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveReply(props.parentComment.id, props.parentComment);
    }
};

// Delete comment
const handleDelete = async (id: string, parentComment: any) => {
    try {
        // Delete the comment (is it a nested comment?)
        const isNestedComment = props.parentComment.replies ? true : false;

        // call deleteComment function
        const response = await deleteComment(activityStore.getActivity()!.graph, id, isNestedComment);

        if (response.status === "OK") {
            // console.log("Kommentar erfolgreich gelöscht.");

            // if comment is nested, remove it from the replies
            if (parentComment.replies) {
                parentComment.replies = parentComment.replies.filter((reply: any) => reply.id !== id);
                isDeleted.value = true;
            }

            // if comment is not nested, delete it directly
            if (!parentComment.replies || parentComment.replies.length === 0) {
                isDeleted.value = true;
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
            <p class="reply-text">{{ isDeleted ? "Kommentar wurde gelöscht" : parentComment.comment }}</p>
        </div>

        <!-- Reply Button to hide input field -->
        <Button @click="toggleReplyInput()">
            {{ replyInputVisible ? 'Cancel' : 'Answer' }}
        </Button>

        <!-- Reply input field -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea ref="textareaRef" v-model="newReplyText" placeholder="Write something to answer..."
                @keydown.enter="handleEnterKey($event)"></textarea>
            <Button @click="saveReply(parentComment.id, parentComment)">Save Comment</Button>
        </div>

        <!-- Show nested replies with recursive component -->
        <div v-if="parentComment.replies && parentComment.replies.length > 0" class="nested-replies">
            <ReplyCard v-for="nestedReply in parentComment.replies" :key="nestedReply.id"
                :parentComment="nestedReply" />
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
