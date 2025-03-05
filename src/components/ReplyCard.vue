<script lang="ts" setup>
import { defineProps, ref, computed, onMounted } from 'vue';
import { Button } from '@/components/ui/button'; // Button-Komponente importieren
import { getConflictDetail } from '@/data/knowledge_graph/read_operations'; // Deine API zum Laden der Details

const props = defineProps({
    conflictReply: {
        type: Object,
        required: true,
    },
});

const replies = computed(() => props.conflictReply.replies ?? []);
const graph = 'Urology_Emergency_after_Debriefing'; // Hardcodierter Graph-Name
const nestedReplies = ref<any[]>([]);
const loadedReplies = ref<Set<string>>(new Set()); // Set zum Verfolgen von geladenen Antwort-IDs

// Toggle für die Anzeige des Antwort-Eingabefelds
const replyInputVisible = ref(false);
const newReplyText = ref('');

// Lade verschachtelte Antworten (falls vorhanden)
const loadNestedReplies = async (replyId: string) => {
    if (loadedReplies.value.has(replyId)) return;

    loadedReplies.value.add(replyId);

    try {
        const response = await getConflictDetail(graph, replyId);

        if (Array.isArray(response.replies)) {
            response.replies.forEach((nestedReply: any) => {
                if (!loadedReplies.value.has(nestedReply.id)) {
                    nestedReplies.value.push(nestedReply);
                    loadedReplies.value.add(nestedReply.id);
                }
            });
        }
    } catch (error) {
        console.error(`Fehler beim Laden der verschachtelten Antworten für replyId: ${replyId}`, error);
    }
};

// Funktion zum Speichern einer Antwort
const saveReply = async () => {
    if (!newReplyText.value) return;

    try {
        // Deine API zum Speichern der Antwort
        console.log("Antwort speichern:", newReplyText.value);

        // Hier kannst du den API-Call einbauen, um die Antwort zu speichern
        // Beispiel: await saveReplyToBackend(props.conflictReply.id, newReplyText.value);

        // Antwort speichern und Eingabefeld zurücksetzen
        nestedReplies.value.push({
            id: Date.now().toString(), // temporäre ID für die Anzeige
            author: "test-replyer", // Temporärer Autor
            comment: newReplyText.value, // Kommentartext
        });
        replyInputVisible.value = false; // Verstecke das Eingabefeld nach dem Speichern
        newReplyText.value = ''; // Leere den Textbereich
    } catch (error) {
        console.error('Fehler beim Speichern der Antwort:', error);
    }
};

// Lade die verschachtelten Antworten, wenn die Komponente gemountet wird
onMounted(() => {
    if (props.conflictReply.id) {
        loadNestedReplies(props.conflictReply.id);
    }
});
</script>

<template>
    <div class="reply-card">
        <div class="reply-content">
            <p class="reply-author">{{ conflictReply.author }}</p>
            <p class="reply-text">{{ conflictReply.comment }}</p>
        </div>

        <!-- Antwort-Button zum Umblenden des Eingabefeldes -->
        <Button @click="replyInputVisible = !replyInputVisible">
            {{ replyInputVisible ? 'Antworten abbrechen' : 'Antworten' }}
        </Button>

        <!-- Antwort Eingabefeld -->
        <div v-if="replyInputVisible" class="reply-input">
            <textarea v-model="newReplyText" placeholder="Schreibe eine Antwort..."></textarea>
            <Button @click="saveReply">Antwort speichern</Button>
        </div>

        <!-- Zeige verschachtelte Antworten an -->
        <div v-if="nestedReplies.length > 0" class="nested-replies">
            <ReplyCard v-for="nestedReply in nestedReplies" :key="nestedReply.id" :conflictReply="nestedReply" />
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
