import { getConflictDetail } from '@/data/knowledge_graph/read_operations';
import { Conflict, Comment } from '@/data/knowledge_graph/structures';import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useConflictsStore = defineStore('ActivityConflicts', () => {
    let conflictDetails = ref<Conflict[]>([]);


    const addConflict = (conflict: Conflict) => {
        conflictDetails.value.push(conflict);
    }

    const setConflicts = (conflicts: Conflict[]) => {
        conflictDetails.value = conflicts;
    };

    const getConflicts = computed(() => {
        return conflictDetails.value;
    });

    const updateConflict = async (conflictId: string, graph: string) => {
        const updatedConflict = await getConflictDetail(graph, conflictId);
        const index = conflictDetails.value.findIndex(conflict => conflict.id === conflictId);
        if (index !== -1) {
            conflictDetails.value[index] = updatedConflict;
        }
    };
    const removeConflict = (conflictId: string) => {
        const index = conflictDetails.value.findIndex(conflict => conflict.id === conflictId);
        if (index !== -1) {
            conflictDetails.value.splice(index, 1); // Ändert das bestehende Array statt es zu ersetzen
        }
    };

    // **REPLIES-Methods**
    
    // Kommentar zu einem Konflikt hinzufügen
    const addReplyToConflict = (conflictId: string, reply: Comment) => {
        const conflict = conflictDetails.value.find(c => c.id === conflictId);
        if (conflict) {
            if (!conflict.replies) {
                conflict.replies = []; // Falls noch keine Replies existieren
            }
            conflict.replies.push(reply);
        }
    };

    // Kommentar aus einem Konflikt entfernen
    const removeReplyFromConflict = (conflictId: string, replyId: string) => {
        const conflict = conflictDetails.value.find(c => c.id === conflictId);
        if (conflict && conflict.replies) {
            conflict.replies = conflict.replies.filter(reply => reply.id !== replyId);
        }
    };

    // Kommentar in einem Konflikt aktualisieren (z. B. bei Bearbeitung)
    const updateReplyInConflict = (conflictId: string, replyId: string, updatedText: string) => {
        const conflict = conflictDetails.value.find(c => c.id === conflictId);
        if (conflict && conflict.replies) {
            const reply = conflict.replies.find(r => r.id === replyId);
            if (reply) {
                reply.comment = updatedText;
            }
        }
    };

    return { 
        addConflict,
        setConflicts,
        getConflicts,
        updateConflict,
        removeConflict,
        removeReplyFromConflict, 
        addReplyToConflict, 
        updateReplyInConflict
    };


});
