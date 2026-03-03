import ContentPage from "@/views/ContentPage.vue";
import HomePage from "@/views/HomePage.vue";
import StartPage from "@/views/StartPage.vue";
import FeedbackPage from "@/views/FeedbackPage.vue";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import MainLayout from "@/components/MainLayout.vue";
import { useSessionStore } from "@/stores/sessionStore";
import FeedbackThankyouPage from "@/views/FeedbackThankyouPage.vue";
import LoginPage from "@/views/LoginPage.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: "/login",
        name: "Login",
        component: LoginPage,
    },
    {
        path: "/start",
        name: "Start",
        component: StartPage,
    },
    {
        path: "/feedback/:graph",
        name: "FeedbackPage",
        component: FeedbackPage,
        props: true,
    },
    {
        path: "/feedback-thank-you",
        name: "FeedbackThankYouPage",
        component: FeedbackThankyouPage,
    },
    {
        path: "/",
        component: MainLayout,
        children: [
            { path: "", name: "HomePage", component: HomePage, props: true }, // Standard dashboard
            { path: ":id", name: "Content", component: ContentPage, props: true }, // Dynamic content pages
        ],
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

let isInitialLoad = true;

router.beforeEach((to) => {
    const sessionStore = useSessionStore();

    // On initial page load, attempt to restore session
    if (isInitialLoad) {
        isInitialLoad = false;

        // Try to restore session from localStorage
        const sessionRestored = sessionStore.restoreSession();

        // If session was restored and we're trying to go to login, redirect to last route instead
        if (sessionRestored && to.path === "/login") {
            const lastRoute = sessionStore.lastRoute;
            return lastRoute && lastRoute !== "/" ? lastRoute : "/";
        }
    }

    // const isPublic = to.name === 'FeedbackPage' || to.name === 'FeedbackThankYouPage';
    const isPublic = to.name === "FeedbackThankYouPage";
    const isOption = to.path === "/options";

    // Permit users from accessing options if they aren't instructors
    if (isOption && sessionStore.instructorMode == false) {
        return "/start";
    }

    // Allow access to options and public pages without active session
    if (isPublic) {
        return;
    }
    // If not logged in and trying to access a non-public page, redirect to login
    if (!sessionStore.isSessionActive && to.path !== "/login") {
        // to.fullPath beinhaltet auch Parameter wie /feedback/123
        return {
            path: "/login",
            query: { redirect: to.fullPath },
        };
    }

    // if (!sessionStore.isSessionActive && to.path !== '/login') {
    //     return '/login';
    // }

    // Save the current route as the last visited route (for session persistence), except for the start page
    if (sessionStore.isSessionActive && !isPublic && to.path !== "/start") {
        sessionStore.saveLastRoute(to.path);
    }
});
export default router;
