// src/stores/activityStore.ts
import { Activity, NestedMultiLangObject } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

/**
 * A Pinia store for managing session-related state and operations.
 * 
 * @remarks
 * This store handles session management including activity, roles, and navigation.
 * 
 * @returns An object containing:
 * - startSession: Function to initiate a new session
 * - endSession: Function to terminate current session
 * - sessionActivity: Reference to the current activity
 * - sessionRole: Reference to the current role
 * - availableRoles: Reference to array of available roles
 * - isSessionActive: Reference indicating if session is active
 * - instructorMode: Reference indicating if instructor mode is enabled
 * 
 * @example
 * ```typescript
 * const sessionStore = useSessionStore();
 * sessionStore.startSession();
 * ```
 */
export const useSessionStore = defineStore('session', () => {
  const router = useRouter();

  const sessionActivity = ref<Activity | undefined>(undefined);
  const sessionRole = ref<string | undefined>(undefined);
  const availableRoles = ref<NestedMultiLangObject>({} as NestedMultiLangObject);
  const instructorMode = ref(false);
  const isSessionActive = ref(false);
  const activeLanguage = ref('de');

  const outdated = ref(false);

  const startSession = () => {
    router.push('/');
    isSessionActive.value = true;
    // TODO: Later this should communicate with the backend to actually implement session behavior
  }

  const endSession = () => {
    router.push('/start');
    sessionRole.value = undefined;
    sessionActivity.value = undefined;
    isSessionActive.value = false;
  }

  return { startSession, endSession, sessionActivity, sessionRole, availableRoles, isSessionActive, instructorMode, outdated, activeLanguage };
});
