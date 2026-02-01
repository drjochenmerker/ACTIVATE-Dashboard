// src/stores/activityStore.ts
import { Activity, LanguageCode, NestedMultiLangObject } from '@/data/knowledge_graph/structures';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
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
    const activeLanguage = ref<LanguageCode>(LanguageCode.Deutsch); // todo: default language
    const activeScene = ref<string>('Scene 1'); // Default scene
    const outdated = ref(false);
    const lastRoute = ref<string>('/');

    const STORAGE_KEY = "session_state";
    const LAST_ROUTE_KEY = "last_route";

    /**
     * Saves session state to localStorage
     */
    const saveSessionToStorage = () => {
        if (!sessionActivity.value) return;
        

        const sessionState = {
            sessionActivity: sessionActivity.value,
            sessionRole: sessionRole.value,
            activeLanguage: activeLanguage.value,
            activeScene: activeScene.value,
            instructorMode: instructorMode.value,
            availableRoles: availableRoles.value,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionState));
    };

    /**
     * Saves the last visited route to localStorage
     */
    const saveLastRoute = (route: string) => {
        lastRoute.value = route;
        localStorage.setItem(LAST_ROUTE_KEY, route);
    };

    /**
     * Restores session state from localStorage
     */
    const restoreSession = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const sessionState = JSON.parse(saved);
                sessionActivity.value = sessionState.sessionActivity;
                sessionRole.value = sessionState.sessionRole;
                activeLanguage.value = sessionState.activeLanguage;
                activeScene.value = sessionState.activeScene;
                instructorMode.value = sessionState.instructorMode;
                availableRoles.value = sessionState.availableRoles;
                isSessionActive.value = true;

                // Restore last route
                const lastSavedRoute = localStorage.getItem(LAST_ROUTE_KEY);
                if (lastSavedRoute) {
                    lastRoute.value = lastSavedRoute;
                }

                return true;
            }
        } catch (error) {
            console.error("Failed to restore session from storage:", error);
        }
        return false;
    };

    const startSession = () => {
        router.push('/');
        isSessionActive.value = true;
        saveSessionToStorage();
        saveLastRoute('/');
        // TODO: Later this should communicate with the backend to actually implement session behavior
    };

    const endSession = () => {
        router.push('/start');
        sessionRole.value = undefined;
        sessionActivity.value = undefined;
        isSessionActive.value = false;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LAST_ROUTE_KEY);
    };

    // Watch for changes to frequently-changing session state and persist
    // Only watch properties that change during a session, not those set once at initialization
    watch(
        () => sessionRole.value,
        () => saveSessionToStorage(),
    );
    watch(
        () => activeLanguage.value,
        () => saveSessionToStorage(),
    );
    watch(
        () => activeScene.value,
        () => saveSessionToStorage(),
    );
    watch(
        () => instructorMode.value,
        () => saveSessionToStorage(),
    );

    return {
        startSession,
        endSession,
        sessionActivity,
        sessionRole,
        availableRoles,
        isSessionActive,
        instructorMode,
        outdated,
        activeLanguage,
        activeScene,
        restoreSession,
        saveLastRoute,
        lastRoute,
    };
});
