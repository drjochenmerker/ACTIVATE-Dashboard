import { getConflictDetail } from '@/data/knowledge_graph/read_operations';
import { Conflict } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
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
    }

    return { addConflict, setConflicts, getConflicts, updateConflict };
});
