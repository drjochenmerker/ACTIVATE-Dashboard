import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Store: activityPoints
 * Manages the currently active points in the activity diagram
 */
export const useActivityPointsStore = defineStore('activityPoints', () => {
    /**
     * Reactive list of currently active point IDs
     */
    const activePoints = ref<string[]>([]);

    /**
     * Sets the active points
     * @param points - Array of point IDs to activate
     */
    const setActivePoints = (points: string[]) => {
        activePoints.value = points;
    };

    /**
     * Returns the list of currently active points
     */
    const getActivePoints = computed(() => {
        return activePoints.value;
    });

    /**
     * Deactivates all currently active points
     */
    const deactivateAllPoints = () => {
        activePoints.value = [];
    };

    return { setActivePoints, getActivePoints, deactivateAllPoints };
});
