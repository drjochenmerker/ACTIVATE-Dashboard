<script lang="ts" setup>
import { defineProps, nextTick, ref } from 'vue';
import { Button } from '@/components/ui/button'; // Button-Komponente importieren
import { addComment, deleteComment } from '@/data/knowledge_graph/write_operations';
import { useActivityStore } from '@/stores/activityStore';

const props = defineProps({
    parentComment: {
        type: Object,
        required: true,
    },
});

const activityStore = useActivityStore();

// Toggle für die Anzeige des Antwort-Eingabefelds
const replyInputVisible = ref(false);
const newReplyText = ref('');

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const toggleReplyInput = async () => {
    replyInputVisible.value = !replyInputVisible.value;
    if (replyInputVisible.value) {
        await nextTick();
        textareaRef.value?.focus();
    }
}


// Funktion zum Speichern einer Antwort
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
                id: Date.now().toString(), // temporäre ID
                author: activityStore.getRole()!, // todo Temporärer Autor
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
        saveReply(props.parentComment.id, props.parentComment);
    }
};

const handleDelete = async (id: string, parentComment: any) => {
    console.log("Lösche Kommentar mit ID:", id);
    try {
        // Lösche den Kommentar (ist es ein verschachtelter Kommentar?)
        const isNestedComment = parentComment.replies ? true : false;

        // Aufruf der deleteComment-Funktion
        const response = await deleteComment(activityStore.getActivity()!.graph, id, isNestedComment);

        // Überprüfen, ob die Antwort erfolgreich war
        if (response.status === "OK") {
            console.log("Kommentar erfolgreich gelöscht.");

            // Wenn der Kommentar verschachtelt ist, entferne ihn aus den replies
            if (parentComment.replies) {
                parentComment.replies = parentComment.replies.filter((reply: any) => reply.id !== id);
            }
            // Wenn der Kommentar keine verschachtelten Antworten hat, lösche ihn direkt
            if (!parentComment.replies || parentComment.replies.length === 0) {
                // Hier kannst du den Kommentar aus der übergeordneten Liste der Kommentare entfernen, 
                // falls der Kommentar direkt entfernt wurde.
            }
        } else {
            console.error("Fehler beim Löschen des Kommentars.");
        }
    } catch (error) {
        console.error("Fehler beim Löschen des Kommentars:", error);
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
            <Button @click="saveReply(parentComment.id, parentComment)">Save Comment</Button>
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
