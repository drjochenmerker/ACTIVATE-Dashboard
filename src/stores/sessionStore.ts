// src/stores/activityStore.ts
import { Activity } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export const useSessionStore = defineStore('session', () => {
  const router = useRouter();
  
  const sessionActivity = ref<Activity | undefined>(undefined);
  const sessionRole = ref<string | undefined>(undefined);
  const availableRoles = ref<string[]>([]);
  const instructorMode = ref(false);
  const isSessionActive = ref(false);

  const startSession = () => {
    router.push('/');
    isSessionActive.value = true;
  }

  const endSession = () => {
    router.push('/start');
    sessionRole.value = undefined;
    sessionActivity.value = undefined;
    isSessionActive.value = false;
  }

  return { startSession, endSession, sessionActivity, sessionRole, availableRoles, isSessionActive, instructorMode };
});
