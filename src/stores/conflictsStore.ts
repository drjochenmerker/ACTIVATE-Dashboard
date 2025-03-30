import { getConflictDetail } from '@/data/knowledge_graph/read_operations';
import { Conflict } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useConflictsStore = defineStore('ActivityConflicts', () => {
    let conflictDetails = ref<Conflict[]>([]);

    // add a conflict to the list
    const addConflict = (conflict: Conflict) => {
        conflictDetails.value.push(conflict);
    }

    // set all the conflicts
    const setConflicts = (conflicts: Conflict[]) => {
        conflictDetails.value = conflicts;
    };

    // get all conflicts
    const getConflicts = computed(() => conflictDetails.value);

    // update a Conflict by its ID from graph
    const updateConflict = async (conflictId: string, graph: string) => {
        const updatedConflict = await getConflictDetail(graph, conflictId);
        const index = conflictDetails.value.findIndex(conflict => conflict.id === conflictId);
        if (index !== -1) {
            conflictDetails.value[index] = updatedConflict;  // Reaktive Änderung
        }
    };

    // remove a Conflict by its ID
    const removeConflict = (conflictId: string) => {
        const index = conflictDetails.value.findIndex(conflict => conflict.id === conflictId);
        if (index !== -1) {
            conflictDetails.value.splice(index, 1);  // Reaktive Änderung
        }
    };


    return {
        addConflict,
        setConflicts,
        getConflicts,
        updateConflict,
        removeConflict
    };
});
