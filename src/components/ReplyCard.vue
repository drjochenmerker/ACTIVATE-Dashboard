<script lang="ts" setup>
import { defineProps, computed, ref, onMounted } from 'vue';
import ReplyCard from './ReplyCard.vue';
import { getConflictDetail } from '@/data/knowledge_graph/read_operations';

const props = defineProps({
    conflictReply: {
        type: Object,
        required: true,
    },
});

const replies = computed(() => props.conflictReply.replies ?? []);
const graph = 'Urology_Emergency_after_Debriefing'; // Hardcoded graph title
const nestedReplies = ref<any[]>([]);

const loadedReplies = ref<Set<string>>(new Set()); // Track loaded reply IDs

const loadNestedReplies = async (replyId: string) => {
    // Wenn diese Antwort bereits geladen wurde, tue nichts
    if (loadedReplies.value.has(replyId)) {
        return;
    }

    loadedReplies.value.add(replyId); // Markiere diese Antwort-ID als geladen

    try {
        const response = await getConflictDetail(graph, replyId);

        // Sicherstellen, dass die Antwortstruktur gültig ist
        if (Array.isArray(response.replies)) {
            // Wenn neue Antworten vorhanden sind, füge sie nur hinzu, wenn sie noch nicht geladen wurden
            response.replies.forEach((nestedReply: any) => {
                if (!loadedReplies.value.has(nestedReply.id)) {
                    nestedReplies.value.push(nestedReply);
                    loadedReplies.value.add(nestedReply.id); // Füge auch die ID der geladenen Antworten hinzu
                }
            });
        }
    } catch (error) {
        console.error(`Fehler beim Laden der verschachtelten Antworten für replyId: ${replyId}`, error);
    }
};

// Wenn die Komponente gemountet wird, lade die verschachtelten Antworten
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

        <!-- Zeige verschachtelte Antworten an, wenn welche vorhanden sind -->
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

.nested-replies {
    margin-top: 10px;
    padding-left: 20px;
}
</style>
