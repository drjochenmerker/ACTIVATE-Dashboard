import { getAllConflictsWithDetail, getConflictDetail } from "@/data/knowledge_graph/read_operations";
import { Conflict } from "@/data/knowledge_graph/structures";
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSessionStore } from "./sessionStore";

/**
 * Store: ActivityConflicts
 * Manages the list of conflicts associated with the current activity
 */
export const useConflictsStore = defineStore("ActivityConflicts", () => {
    /**
     * Reactive list of conflicts with detailed data
     */
    let conflictDetails = ref<Conflict[]>([]);

    // Access to the current session/activity context
    const sessionStore = useSessionStore();

    /**
     * Refreshes the conflict list by fetching all conflicts for the current activity
     */
    const refreshConflictList = async () => {
        const activity = sessionStore.sessionActivity;
        if (activity) {
            const conflicts = await getAllConflictsWithDetail(activity.graph);
            setConflicts(conflicts);
            conflictDetails.value = conflicts;
        }
    };

    /**
     * Adds a single conflict to the local list
     * @param conflict - The conflict to be added
     */
    const addConflict = (conflict: Conflict) => {
        conflictDetails.value.push(conflict);
    };

    /**
     * Sets the complete list of conflicts
     * @param conflicts - The new list of conflicts
     */
    const setConflicts = (conflicts: Conflict[]) => {
        conflictDetails.value = conflicts;
    };

    /**
     * Returns the list of all currently stored conflicts
     */
    const getConflicts = computed(() => {
        return conflictDetails.value;
    });

    /**
     * Updates a conflict by its ID by fetching the latest detail from the server
     * @param conflictId - ID of the conflict to update
     * @param graph - Graph context to fetch from
     */
    const updateConflict = async (conflictId: string, graph: string) => {
        const updatedConflict = await getConflictDetail(graph, conflictId);
        const index = conflictDetails.value.findIndex((conflict) => conflict.id === conflictId);
        if (index !== -1) {
            conflictDetails.value[index] = updatedConflict; // Reaktive Änderung
        }
    };

    /**
     * Removes a conflict by its ID
     * @param conflictId - ID of the conflict to remove
     */
    const removeConflict = (conflictId: string) => {
        const index = conflictDetails.value.findIndex((conflict) => conflict.id === conflictId);
        if (index !== -1) {
            conflictDetails.value.splice(index, 1); // Reaktive Änderung
        }
    };

    return {
        addConflict,
        setConflicts,
        getConflicts,
        updateConflict,
        removeConflict,
        refreshConflictList,
    };
});
