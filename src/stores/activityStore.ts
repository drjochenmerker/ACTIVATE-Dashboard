// src/stores/activityStore.ts
import { Activity } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useActivityStore =  defineStore('activities', () => {
  const selectedActivity = ref<Activity | null>(null);
  const selectedRole = ref<string | null>(null);


  const setActivity = (activity: Activity) => {
    selectedActivity.value = activity;
  };

  const getActivity = () => {
    return selectedActivity.value;
  };

  const setRole = (role: string) => {
    selectedRole.value = role;
  };

  const getRole = () => {
    return selectedRole.value;
  };

  return { setActivity, getActivity, setRole, getRole };
});
