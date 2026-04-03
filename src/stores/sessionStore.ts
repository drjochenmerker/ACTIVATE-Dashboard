// src/stores/activityStore.ts
import { Activity, LanguageCode, MultiLangObject, NestedMultiLangObject } from '@/data/knowledge_graph/structures';
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
    const authToken = ref<string | undefined>(undefined);
    const availableRoles = ref<NestedMultiLangObject>({} as NestedMultiLangObject);
    const instructorMode = ref(false);
    const instructorView = ref(false);
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
        const sessionState = {
            sessionActivity: {},
            sessionRole: sessionRole.value,
            authToken: authToken.value,
            activeLanguage: activeLanguage.value,
            activeScene: activeScene.value,
            instructorMode: instructorMode.value,
            instructorView: instructorView.value,
            availableRoles: availableRoles.value,
        };
        if (sessionActivity.value) {
            sessionState['sessionActivity'] = sessionActivity.value;
        }
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
                if (!sessionState.authToken) {
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(LAST_ROUTE_KEY);
                    return false;
                }
                sessionActivity.value = sessionState.sessionActivity;
                sessionRole.value = sessionState.sessionRole;
                authToken.value = sessionState.authToken;
                activeLanguage.value = sessionState.activeLanguage;
                activeScene.value = sessionState.activeScene;
                instructorMode.value = sessionState.instructorMode;
                instructorView.value = sessionState.instructorView;
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

    // Starts new session with JWT Token and activates the session for a specific activity/scenario (when called without the token)
    const startSession = (token?: string) => {
        router.push('/');
        isSessionActive.value = true;
        if (token !== undefined) {
            authToken.value = token;
        }
        saveSessionToStorage();
        saveLastRoute('/');
    };

    const endSession = () => {
        router.push('/start');
        sessionRole.value = undefined;
        sessionActivity.value = undefined;
        authToken.value = undefined;
        isSessionActive.value = false;
        instructorMode.value = false;
        instructorView.value = false;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(LAST_ROUTE_KEY);
    };

    /**
     * Returns the label for a given role ID in the specified language.
     * @param tree The nested multi-language object tree to search in. (Usually the availableRoles)
     * @param roleId The ID of the role to find.
     * @returns The author node or null if not found.
     */
    const getRoleById = (
        tree: NestedMultiLangObject,
        roleId: string | undefined
    ): MultiLangObject | null => {

        if(tree.values && tree.values.length > 0) {
        // check current level
            for (const val of tree.values) {
                if (val.id === roleId) {
                    return val;
                }
            }
        }

        if(!tree.next) {
            return null;
        }

        // recursive check in levels below
        for (const child of tree.next) {
            const found = getRoleById(child, roleId);
            if (found) {
                return found;
            }
        }

        return null;
    };

    // Watch for changes to frequently-changing session state and persist
    // Only watch properties that change during a session, not those set once at initialization
    watch(
        () => sessionRole.value,
        () => saveSessionToStorage(),
    );
    watch(
        () => authToken.value,
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
    watch(
        () => instructorView.value,
        () => saveSessionToStorage(),
    );

    return {
        startSession,
        endSession,
        sessionActivity,
        sessionRole,
        authToken,
        availableRoles,
        isSessionActive,
        instructorMode,
        instructorView,
        outdated,
        activeLanguage,
        activeScene,
        restoreSession,
        saveLastRoute,
        lastRoute,
        getRoleById,
    };
});
