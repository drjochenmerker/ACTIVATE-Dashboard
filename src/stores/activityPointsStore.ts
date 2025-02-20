import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useActivityPointsStore = defineStore('activityPoints', () => {
    let activePoints = ref<string[]>([]);


    const setActivePoints = (points: string[]) => {
        activePoints.value = points;
    };

    const getActivePoints = computed(() => {
        return activePoints.value;
    });

    return { setActivePoints, getActivePoints };
});
