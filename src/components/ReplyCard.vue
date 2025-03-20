<script lang="ts" setup>
import { defineProps, nextTick, ref } from 'vue';
import { Button } from '@/components/ui/button'; // Button-Komponente importieren
import { addComment, deleteConflict } from '@/data/knowledge_graph/write_operations';

const props = defineProps({
    parentComment: {
        type: Object,
        required: true,
    },
});

const graph = 'Urology_Emergency_after_Debriefing';

// Toggle für die Anzeige des Antwort-Eingabefelds
const replyInputVisible = ref(false);
const newReplyText = ref('');

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const toggleReplyInput = async () => {
    replyInputVisible.value = !replyInputVisible.value;
    if (replyInputVisible.value) {
        await nextTick();
        textareaRef.value?.focus();
    }
}

// Funktion zum Speichern einer Antwort
const saveReply = async (parentCommentId: string) => {
    console.log(`save comment for conflict with id: ${parentCommentId}:`, newReplyText.value)

    if (!newReplyText.value) return;

    try {
        const response = await addComment(
            graph,
            parentCommentId,
            "test-replyer",
            newReplyText.value
        );

        console.log("Unterkommentar erfolgreich gespeichert:", response);

        if (!props.parentComment.replies) {
            props.parentComment.replies = [];
        }
        // Neue Referenz für `replies` zuweisen
        props.parentComment.replies = [
            ...props.parentComment.replies, // alte Antworten
            {
                id: Date.now().toString(), // temporäre ID
                author: "test-replyer", // todo Temporärer Autor
                comment: newReplyText.value, // Kommentartext
                replies: [] // Leeres Array für mögliche weitere Verschachtelungen
            }
        ];
        replyInputVisible.value = false; // Eingabefeld verstecken
        newReplyText.value = ''; // Textfeld leeren
    } catch (error) {
        console.error('Fehler beim Speichern der Antwort:', error);
    }
};


// Funktion zum Abschicken per Enter-Taste im Textarea
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        saveReply(props.parentComment.id);
    }
};

const handleDelete = async (id: string) => {
    console.log(id);
    try {
        const response = await deleteConflict(graph, id);
        if (response.status === "OK") {
            console.log("Konflikt erfolgreich gelöscht.");
        } else {
            console.error("Fehler beim Löschen des Konflikts.");
        }

    } catch (error) {
        console.error("Fehler beim Löschen des Konflikts:", error);
    }
};

</script>

<template>
    <div class="reply-card">
        <div class="reply-content">
            <div class="reply-head">
                <p class="reply-author">{{ parentComment.author }}</p>
                <button class="icon-button" @click="handleDelete(parentComment.id)">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
            <p class="reply-text">{{ parentComment.comment }}</p>
        </div>


        <!-- Antwort-Button zum Umblenden des Eingabefeldes -->
        <Button @click="toggleReplyInput()">
            {{ replyInputVisible ? 'Cancel' : 'Answer' }}
        </Button>

        <!-- Antwort Eingabefeld -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea ref="textareaRef" v-model="newReplyText" placeholder="Write something to answer..."
                @keydown.enter="handleEnterKey($event)"></textarea>
            <Button @click="saveReply(parentComment.id)">Save Comment</Button>
        </div>

        <!-- Zeige verschachtelte Antworten an -->
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
