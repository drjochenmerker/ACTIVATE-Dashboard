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

    return { addConflict, setConflicts, getConflicts };
});
