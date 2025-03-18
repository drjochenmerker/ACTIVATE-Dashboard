// src/stores/activityStore.ts
import { Activity } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useActivityStore =  defineStore('activities', () => {
  const selectedActivity = ref<Activity | null>(null);

  const setActivity = (activity: Activity) => {
    selectedActivity.value = activity;
  };

  const getActivity = () => {
    return selectedActivity.value;
  };

  return { setActivity, getActivity };
});
