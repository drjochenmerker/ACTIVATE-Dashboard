<script lang="ts" setup>
import { addComment, deleteComment } from '@/data/knowledge_graph/write_operations';
import { defineProps, nextTick, ref } from 'vue';
import Button from './ui/button/Button.vue';
import ReplyCard from './ReplyCard.vue';

const graph = 'Urology_Emergency_after_Debriefing'; //todo hard coded graph title

const props = defineProps({
    comment: {
        type: Object,
        required: true,
    }
});
const [extractedTitle, extractedContent] = props.comment.comment.split('|');

const conflictDetail = ref(props.comment);
const replyInputVisible = ref<Record<string, boolean>>({});
const newReplyText = ref<Record<string, string>>({});
const textareaRef = ref<HTMLTextAreaElement | null>(null);


// delete conflicts
const handleDelete = async (id: string) => {
    try {
        //comment cant be nested because its the misc card
        await deleteComment(graph, id, false);
    } catch (error) {
        console.error("Error deleting conflict: ", error);
    }
};

// replyinput
const toggleReplyInput = async (conflictId: string) => {
    replyInputVisible.value[conflictId] = !replyInputVisible.value[conflictId];
    if (replyInputVisible.value[conflictId]) {
        await nextTick();
        textareaRef.value?.focus();
    }
    if (!replyInputVisible.value[conflictId]) {
        newReplyText.value[conflictId] = ''; // Textfeld leeren
    }
};

//enter key
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveReply(props.comment.id);
    }
};

const saveReply = async (conflictId: string) => {
    if (!newReplyText.value[conflictId]) return;

    try {
        const response = await addComment(
            graph,
            conflictId,
            "test-replyer", // TODO Temporärer Hardcoded-Autor
            newReplyText.value[conflictId]
        );

        console.log("Kommentar erfolgreich gespeichert:", response);

        if (conflictDetail.value) {
            if (!conflictDetail.value.replies) {
                conflictDetail.value.replies = [];
            }
            // Neue Referenz für `replies` zuweisen
            conflictDetail.value.replies = [
                ...conflictDetail.value.replies, // alte Kommentare
                {
                    id: Date.now().toString(), // temporäre ID
                    author: "test-replyer", //todo
                    comment: newReplyText.value[conflictId],
                    replies: []
                }
            ];
        }
        replyInputVisible.value[conflictId] = false;
        newReplyText.value[conflictId] = '';
    } catch (error) {
        console.error("Error saving comment:", error);
    }
    console.log("conflictDetail", conflictDetail.value);

};

</script>

<template>
    <div class="misc-note-card">
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
            <div class="misc-note-title" v-html="extractedTitle"></div>
            <div class="misc-note-description" v-html="extractedContent"></div>
        </div>

        <div class="note-comment-section">
            <Button @click="toggleReplyInput(props.comment.id)"> Add comment </Button>
        </div>

        <div v-if="replyInputVisible[props.comment.id]" class="comment-input">
            <textarea ref="textareaRef" v-model="newReplyText[props.comment.id]" placeholder="Write a reply..."
                @keydown.enter="handleEnterKey($event)" />
            <Button @click="saveReply(props.comment.id)">Save</Button>
        </div>

        <div v-if="conflictDetail && conflictDetail.replies && conflictDetail.replies.length > 0"
            class="reply-container">
            <ReplyCard v-for="(reply) in conflictDetail.replies" :key="reply.id" :parentComment="reply"
                :conflictId="conflictDetail.id" />
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
