// src/composables/useSession.ts
import { ref } from 'vue';

const isSessionActive = ref(false);

function startSession() {
  isSessionActive.value = true;
}

function endSession() {
  isSessionActive.value = false;
}

export function useSession() {
  return { isSessionActive, startSession, endSession };
}
