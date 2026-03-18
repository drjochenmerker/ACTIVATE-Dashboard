import { getActivities } from '@/data/knowledge_graph/read_operations';
import { Activity } from '@/data/knowledge_graph/structures';
import { cloneActivity, deleteActivity, updateActivity } from '@/data/knowledge_graph/write_operations';
import { defineStore } from 'pinia';
import { ref} from 'vue';

/**
 * Store: ActivityStore
 * Manages the list of excisting activities
 */

export const useActivityStore = defineStore('ActivityStore', () => {
    /**
     * Reactive reference to the list of activities managed by the store.
     * Initialized as an empty array and can be dynamically updated.
     * 
     * @type {Ref<Activity[]>}
     */
    const activityList = ref<Activity[]>([]);
    /**
     * Retrieves all activities from the data source and updates the activity list.
     * 
     * @returns {Promise<Activity[]>} A promise that resolves to the list of activities
     */
    const getAllActivities = async () => {
        activityList.value = await getActivities();
        return activityList.value;
    };

    const setActivities = (activities: Activity[]) => {
        activityList.value = activities;
    };

    const refreshActivityList = async()=> {
        const activities = await getAllActivities();
        if(activities.length > 0) {
            setActivities(activities);
            activityList.value = activities
        }
    };
    const editActivity = async (activity: Activity) => {
        const updatedActivity = await updateActivity(activity);
        if (updatedActivity.status !== "OK") {
            console.log("Update failed.")
        }
        refreshActivityList();
    };
    
    const addActivity = (activity: Activity) => {
        activityList.value.push(activity);
    };
    const cloneThisActivity = async (clonedActivity: Activity) => {
        const savedClone = await cloneActivity(clonedActivity);
        if (savedClone.status !== "OK") {
            console.log("Cloning failed.")
        }
        refreshActivityList();
    }
    const removeActivity = async (graph: string) => {
        const deletion = await deleteActivity(graph);
        if (deletion.status === "OK") {
            //console.log("Deleted activity successfully.")
        } else {
            console.log("Deletion failed.")
        }
        refreshActivityList();
    };
    

    return {
        activityList,
        refreshActivityList,
        editActivity,
        addActivity,
        setActivities,
        cloneThisActivity,
        removeActivity,
        getAllActivities
    };
})