<script lang="ts" setup>
import { defineProps, nextTick, ref } from 'vue';
import { Button } from '@/components/ui/button'; // Button-Komponente importieren
import { addComment } from '@/data/knowledge_graph/write_operations';
import { useSessionStore } from '@/stores/sessionStore';

const props = defineProps({
    parentComment: {
        type: Object,
        required: true,
    },
});

const sessionStore = useSessionStore();

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
            // There must be a cleaner way, but I know for sure that the activity is not null since it must be set in start page
            sessionStore.sessionActivity!.graph,
            parentCommentId,
            sessionStore.sessionRole!,
            newReplyText.value
        );

        console.log("Unterkommentar erfolgreich gespeichert:", response)

        if (!props.parentComment.replies) {
            props.parentComment.replies = [];
        }
        // Füge die neue Antwort (Reply) hinzu
        props.parentComment.replies.push({
            id: Date.now().toString(), // temporäre ID
            author: sessionStore.sessionRole!, // Temporärer Autor
            comment: newReplyText.value, // Kommentartext
            replies: [] // Leeres Array für mögliche weitere Verschachtelungen
        });
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

</script>

<template>
    <div class="reply-card">
        <div class="reply-content">
            <p class="reply-author">{{ parentComment.author }}</p>
            <p class="reply-text">{{ parentComment.comment }}</p>
        </div>

        <!-- Antwort-Button zum Umblenden des Eingabefeldes -->
        <Button @click="toggleReplyInput()">
            {{ replyInputVisible ? 'Cancel' : 'Answer' }}
        </Button>

        <!-- Antwort Eingabefeld -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea ref="textareaRef" v-model="newReplyText" placeholder="Write something to answer..." @keydown.enter="handleEnterKey($event)"></textarea>
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
